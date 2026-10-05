import { Booking, BookingStatus, CommissionStatus, BookingEvent, BookingEventType } from '@/types';
import { store } from './store';
import { createClient, createAdminClient, isSupabaseServerConfigured } from '@/lib/supabase/server';
import { bookingRequestSchema, BookingRequestInput } from '@/lib/validations/booking';
import { calculateBookingPrice, calculateRentalDays } from '@/lib/utils/pricing';
import { generateBookingReference } from '@/lib/utils/reference';
import { commissionService } from './commission.service';
import { notificationService } from './notification.service';
import { doDatesOverlap } from '@/lib/availability/engine';

export class BookingsService {
  /**
   * Vérifie la disponibilité d'un véhicule pour une plage de dates
   */
  async checkAvailability(
    vehicleId: string,
    startDate: string,
    endDate: string,
    excludeBookingId?: string
  ): Promise<boolean> {
    if (isSupabaseServerConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          // Vérification via la fonction stockée PostgreSQL check_vehicle_availability ou requête directe
          const { data, error } = await supabase
            .from('bookings')
            .select('id, start_date, end_date, status')
            .eq('vehicle_id', vehicleId)
            .in('status', ['APPROVED', 'CONFIRMED', 'ACTIVE', 'REQUESTED', 'UNDER_REVIEW']);

          if (!error && data) {
            const hasConflict = data.some((b) => {
              if (excludeBookingId && b.id === excludeBookingId) return false;
              return doDatesOverlap(startDate, endDate, b.start_date, b.end_date);
            });
            return !hasConflict;
          }
        }
      } catch (err) {
        console.warn('[BookingsService] Availability check fallback to local store:', err);
      }
    }

    // Fallback mémoire
    const existing = store.getBookings().filter((b) => b.vehicle_id === vehicleId);
    return !existing.some((b) => {
      if (excludeBookingId && b.id === excludeBookingId) return false;
      if (b.status === 'CANCELLED' || b.status === 'REJECTED') return false;
      return doDatesOverlap(startDate, endDate, b.start_date, b.end_date);
    });
  }

  /**
   * Récupère une réservation par sa référence unique (ex: CD-2026-001842)
   */
  async getBookingByReference(reference: string): Promise<Booking | null> {
    const cleanRef = reference.trim();

    if (isSupabaseServerConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('bookings')
            .select('*, vehicle:vehicles(*), agency:agencies(*), events:booking_events(*)')
            .or(`reference.eq.${cleanRef},booking_ref.eq.${cleanRef}`)
            .single();

          if (!error && data) {
            return data as unknown as Booking;
          }
        }
      } catch (err) {
        console.warn('[BookingsService] Error fetching booking by ref:', err);
      }
    }

    // Fallback store mémoire
    const all = store.getBookings();
    return all.find((b) => b.reference === cleanRef || b.booking_ref === cleanRef) || null;
  }

  /**
   * Récupère les réservations (avec filtre optionnel d'agence ou de client)
   */
  async getBookings(filters?: { agencyId?: string; customerId?: string; status?: BookingStatus }): Promise<Booking[]> {
    if (isSupabaseServerConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          let query = supabase
            .from('bookings')
            .select('*, vehicle:vehicles(*), agency:agencies(*), events:booking_events(*)');

          if (filters?.agencyId) {
            query = query.eq('agency_id', filters.agencyId);
          }
          if (filters?.customerId) {
            query = query.eq('customer_id', filters.customerId);
          }
          if (filters?.status) {
            query = query.eq('status', filters.status);
          }

          const { data, error } = await query.order('created_at', { ascending: false });
          if (!error && data) {
            return data as unknown as Booking[];
          }
        }
      } catch (err) {
        console.warn('[BookingsService] Fallback to store for getBookings:', err);
      }
    }

    return store.getBookings(filters?.agencyId);
  }

  /**
   * Création d'une nouvelle demande de réservation par un client.
   * RÈGLES CRITIQUES :
   * 1. La demande n'est PAS une réservation instantanée.
   * 2. Le prix et la commission sont STRICTEMENT calculés côté serveur.
   * 3. Le taux de commission actuel de la plateforme est sauvegardé dans la réservation.
   * 4. La commission initiale est à statut 'PENDING'.
   * 5. Un événement 'REQUEST_CREATED' est journalisé dans booking_events.
   */
  async createBookingRequest(rawInput: BookingRequestInput, customerId?: string): Promise<{
    success: boolean;
    booking?: Booking;
    error?: string;
  }> {
    // 1. Validation de schéma avec Zod
    const validation = bookingRequestSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues.map((i) => i.message).join(', '),
      };
    }

    const input = validation.data;

    // 2. Vérification anti double-booking côté serveur
    const isAvailable = await this.checkAvailability(input.vehicleId, input.startDate, input.endDate);
    if (!isAvailable) {
      return {
        success: false,
        error: 'Ce véhicule n’est plus disponible pour les dates sélectionnées. Veuillez choisir d’autres dates ou explorer les véhicules équivalents.',
      };
    }

    // 3. Récupération du véhicule pour connaître le prix journalier certifié
    const vehicle = store.getVehicles().find((v) => v.id === input.vehicleId);
    if (!vehicle) {
      return {
        success: false,
        error: 'Le véhicule demandé est introuvable ou indisponible.',
      };
    }

    // 4. Calcul financier certifié côté serveur
    const totalDays = calculateRentalDays(input.startDate, input.endDate);
    const platformCommissionRate = await commissionService.getCommissionRate();
    const pricing = calculateBookingPrice(vehicle.daily_price, totalDays, platformCommissionRate);

    // 5. Génération de la référence unique (CD-2026-XXXXXX)
    const reference = generateBookingReference();
    const fullName = `${input.firstName} ${input.lastName}`.trim();
    const nowIso = new Date().toISOString();

    const bookingPayload: Omit<Booking, 'id'> = {
      reference,
      booking_ref: reference,
      vehicle_id: input.vehicleId,
      vehicle,
      agency_id: input.agencyId,
      agency: vehicle.agency,
      customer_id: customerId,
      
      first_name: input.firstName,
      last_name: input.lastName,
      customer_name: fullName,
      cin: input.cin,
      customer_email: input.email || `${input.phone.replace(/[^0-9]/g, '')}@cardrive.ma`,
      customer_phone: input.phone,
      customer_country: input.country,
      birth_date: input.birthDate,
      license_number: input.licenseNumber,
      license_expiry: input.licenseExpiry,

      start_date: input.startDate,
      end_date: input.endDate,
      pickup_time: input.pickupTime,
      dropoff_time: input.dropoffTime,
      pickup_location: input.pickupLocation,
      dropoff_location: input.dropoffLocation,
      total_days: totalDays,

      delivery_type: input.deliveryType,
      flight_number: input.flightNumber,
      flight_arrival_time: input.flightArrivalTime,
      child_seat: input.childSeat,
      additional_driver: input.additionalDriver,
      customer_notes: input.customerNotes,
      notes: input.customerNotes,

      daily_price: pricing.daily_price,
      subtotal: pricing.subtotal,
      total_price: pricing.total,
      commission_rate: pricing.commission_rate,
      commission_amount: pricing.commission_amount,
      agency_amount: pricing.agency_amount,
      deposit_amount: vehicle.deposit || 3000,

      status: 'REQUESTED',
      agency_status: 'PENDING',
      commission_status: 'PENDING',

      requested_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
      events: [],
    };

    let createdBooking: Booking;

    // Tentative d'insertion Supabase
    if (isSupabaseServerConfigured()) {
      try {
        const supabase = (await createAdminClient()) || (await createClient());
        if (supabase) {
          const { data, error } = await supabase
            .from('bookings')
            .insert({
              reference,
              booking_ref: reference,
              vehicle_id: input.vehicleId,
              agency_id: input.agencyId,
              customer_id: customerId || null,
              first_name: input.firstName,
              last_name: input.lastName,
              customer_name: fullName,
              cin: input.cin,
              customer_email: input.email || `${input.phone.replace(/[^0-9]/g, '')}@cardrive.ma`,
              customer_phone: input.phone,
              customer_country: input.country,
              birth_date: input.birthDate,
              license_number: input.licenseNumber,
              license_expiry: input.licenseExpiry,
              start_date: input.startDate,
              end_date: input.endDate,
              pickup_time: input.pickupTime,
              dropoff_time: input.dropoffTime,
              pickup_location: input.pickupLocation,
              dropoff_location: input.dropoffLocation,
              total_days: totalDays,
              delivery_type: input.deliveryType,
              flight_number: input.flightNumber || null,
              flight_arrival_time: input.flightArrivalTime || null,
              child_seat: input.childSeat,
              additional_driver: input.additionalDriver,
              customer_notes: input.customerNotes || null,
              daily_price: pricing.daily_price,
              total_price: pricing.total,
              commission_rate: pricing.commission_rate,
              deposit_amount: vehicle.deposit || 3000,
              status: 'REQUESTED',
              commission_status: 'PENDING',
              requested_at: nowIso,
            })
            .select('*, vehicle:vehicles(*), agency:agencies(*)')
            .single();

          if (!error && data) {
            createdBooking = data as unknown as Booking;
            // Journaliser l'événement initial
            await this.logEvent(createdBooking.id, 'REQUEST_CREATED', 'CUSTOMER', customerId, {
              reference,
              vehicle: `${vehicle.brand} ${vehicle.model}`,
              total: pricing.total,
            });
            return { success: true, booking: createdBooking };
          }
        }
      } catch (err) {
        console.warn('[BookingsService] Supabase insert failed, fallback to store:', err);
      }
    }

    // Fallback store mémoire
    createdBooking = store.createBooking(bookingPayload);
    await this.logEvent(createdBooking.id, 'REQUEST_CREATED', 'CUSTOMER', customerId, {
      reference,
      vehicle: `${vehicle.brand} ${vehicle.model}`,
    });

    return { success: true, booking: createdBooking };
  }

  /**
   * Validation de la demande par l'agence (APPROBATION)
   * Statut devient APPROVED, la commission devient CONFIRMED.
   */
  async approveBooking(bookingIdOrRef: string, agencyNotes?: string, actorId?: string): Promise<{
    success: boolean;
    booking?: Booking;
    error?: string;
  }> {
    const booking = await this.resolveBooking(bookingIdOrRef);
    if (!booking) return { success: false, error: 'Réservation introuvable' };

    const nowIso = new Date().toISOString();

    if (isSupabaseServerConfigured()) {
      try {
        const supabase = (await createAdminClient()) || (await createClient());
        if (supabase) {
          const { data, error } = await supabase
            .from('bookings')
            .update({
              status: 'APPROVED',
              agency_status: 'ACCEPTED',
              commission_status: 'CONFIRMED',
              agency_notes: agencyNotes || null,
              confirmed_at: nowIso,
              updated_at: nowIso,
            })
            .eq('id', booking.id)
            .select('*, vehicle:vehicles(*), agency:agencies(*)')
            .single();

          if (!error && data) {
            await this.logEvent(booking.id, 'AGENCY_ACCEPTED', 'AGENCY_OWNER', actorId, { agencyNotes });
            await this.logEvent(booking.id, 'COMMISSION_CONFIRMED', 'SYSTEM', undefined, {
              commission_amount: data.commission_amount || booking.commission_amount,
            });
            return { success: true, booking: data as unknown as Booking };
          }
        }
      } catch (err) {
        console.warn('Supabase update error:', err);
      }
    }

    // Fallback store
    const updated = store.updateBookingStatus(booking.id, 'APPROVED');
    if (updated) {
      updated.commission_status = 'CONFIRMED';
      updated.agency_status = 'ACCEPTED';
      updated.confirmed_at = nowIso;
      await this.logEvent(booking.id, 'AGENCY_ACCEPTED', 'AGENCY_OWNER', actorId, { agencyNotes });
      return { success: true, booking: updated };
    }

    return { success: false, error: 'Impossible de mettre à jour le statut' };
  }

  /**
   * Refus de la demande par l'agence (REJET)
   * Statut devient REJECTED, la commission passe à CANCELLED (aucune commission due).
   */
  async rejectBooking(bookingIdOrRef: string, reason?: string, actorId?: string): Promise<{
    success: boolean;
    booking?: Booking;
    error?: string;
  }> {
    const booking = await this.resolveBooking(bookingIdOrRef);
    if (!booking) return { success: false, error: 'Réservation introuvable' };

    const nowIso = new Date().toISOString();

    if (isSupabaseServerConfigured()) {
      try {
        const supabase = (await createAdminClient()) || (await createClient());
        if (supabase) {
          const { data, error } = await supabase
            .from('bookings')
            .update({
              status: 'REJECTED',
              agency_status: 'REJECTED',
              commission_status: 'CANCELLED',
              rejection_reason: reason || 'Non disponible',
              updated_at: nowIso,
            })
            .eq('id', booking.id)
            .select('*, vehicle:vehicles(*), agency:agencies(*)')
            .single();

          if (!error && data) {
            await this.logEvent(booking.id, 'AGENCY_REJECTED', 'AGENCY_OWNER', actorId, { reason });
            return { success: true, booking: data as unknown as Booking };
          }
        }
      } catch (err) {
        console.warn('Supabase reject error:', err);
      }
    }

    const updated = store.updateBookingStatus(booking.id, 'REJECTED', reason);
    if (updated) {
      updated.commission_status = 'CANCELLED';
      updated.agency_status = 'REJECTED';
      await this.logEvent(booking.id, 'AGENCY_REJECTED', 'AGENCY_OWNER', actorId, { reason });
      return { success: true, booking: updated };
    }

    return { success: false, error: 'Impossible de refuser la demande' };
  }

  /**
   * Proposition d'un véhicule alternatif par l'agence
   */
  async proposeAlternative(
    bookingIdOrRef: string,
    alternativeVehicleId: string,
    notes?: string,
    actorId?: string
  ): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const booking = await this.resolveBooking(bookingIdOrRef);
    if (!booking) return { success: false, error: 'Réservation introuvable' };

    const altVehicle = store.getVehicles().find((v) => v.id === alternativeVehicleId);
    if (!altVehicle) return { success: false, error: 'Véhicule alternatif introuvable' };

    const nowIso = new Date().toISOString();

    if (isSupabaseServerConfigured()) {
      try {
        const supabase = (await createAdminClient()) || (await createClient());
        if (supabase) {
          const { data, error } = await supabase
            .from('bookings')
            .update({
              status: 'ALTERNATIVE_PROPOSED',
              agency_status: 'ALTERNATIVE_PROPOSED',
              agency_notes: notes || `Véhicule alternatif proposé : ${altVehicle.brand} ${altVehicle.model}`,
              updated_at: nowIso,
            })
            .eq('id', booking.id)
            .select()
            .single();

          if (!error && data) {
            await this.logEvent(booking.id, 'ALTERNATIVE_PROPOSED', 'AGENCY_OWNER', actorId, {
              alternativeVehicleId,
              alternativeVehicleName: `${altVehicle.brand} ${altVehicle.model}`,
              notes,
            });
            return { success: true, booking: { ...booking, status: 'ALTERNATIVE_PROPOSED', alternative_vehicle: altVehicle } };
          }
        }
      } catch (err) {
        console.warn('Supabase alternative error:', err);
      }
    }

    const updated = store.updateBookingStatus(booking.id, 'ALTERNATIVE_PROPOSED');
    if (updated) {
      updated.alternative_vehicle_id = alternativeVehicleId;
      updated.alternative_vehicle = altVehicle;
      await this.logEvent(booking.id, 'ALTERNATIVE_PROPOSED', 'AGENCY_OWNER', actorId, {
        alternativeVehicleName: `${altVehicle.brand} ${altVehicle.model}`,
        notes,
      });
      return { success: true, booking: updated };
    }

    return { success: false, error: 'Impossible de proposer l’alternative' };
  }

  /**
   * Journalise un événement dans booking_events
   */
  async logEvent(
    bookingId: string,
    eventType: BookingEventType | string,
    actorRole: 'CUSTOMER' | 'AGENCY_OWNER' | 'AGENCY_MANAGER' | 'AGENCY_STAFF' | 'SUPER_ADMIN' | 'SYSTEM' = 'SYSTEM',
    actorId?: string,
    metadata?: Record<string, any>
  ): Promise<BookingEvent> {
    const event: BookingEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      booking_id: bookingId,
      actor_id: actorId,
      actor_role: actorRole,
      event_type: eventType,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    };

    if (isSupabaseServerConfigured()) {
      try {
        const supabase = (await createAdminClient()) || (await createClient());
        if (supabase) {
          await supabase.from('booking_events').insert({
            booking_id: bookingId,
            actor_id: actorId || null,
            actor_role: actorRole,
            event_type: eventType,
            metadata: metadata || {},
          });
        }
      } catch (err) {
        console.warn('[BookingsService] Could not persist booking_event:', err);
      }
    }

    // Enregistrer dans le cache mémoire
    store.addBookingEvent(event);
    return event;
  }

  /**
   * Récupère tous les événements d'une réservation (Timeline)
   */
  async getBookingEvents(bookingId: string): Promise<BookingEvent[]> {
    if (isSupabaseServerConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('booking_events')
            .select('*')
            .eq('booking_id', bookingId)
            .order('created_at', { ascending: true });

          if (!error && data) {
            return data as BookingEvent[];
          }
        }
      } catch (err) {
        console.warn('Could not fetch events from DB:', err);
      }
    }

    return store.getBookingEvents(bookingId);
  }

  private async resolveBooking(idOrRef: string): Promise<Booking | null> {
    const all = store.getBookings();
    const found = all.find((b) => b.id === idOrRef || b.reference === idOrRef || b.booking_ref === idOrRef);
    if (found) return found;
    return await this.getBookingByReference(idOrRef);
  }
}

export const bookingsService = new BookingsService();
