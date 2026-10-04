import { Booking, BookingStatus } from '@/types';
import { store } from './store';
import { createClient, isSupabaseServerConfigured } from '@/lib/supabase/server';
import { bookingSchema, BookingInput } from '@/lib/validations/booking';
import { doDatesOverlap } from '@/lib/availability/engine';

export class BookingsService {
  async getBookings(agencyId?: string): Promise<Booking[]> {
    if (isSupabaseServerConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          let query = supabase
            .from('bookings')
            .select('*, vehicle:vehicles(*), agency:agencies(*)');

          if (agencyId) {
            query = query.eq('agency_id', agencyId);
          }

          const { data, error } = await query.order('created_at', { ascending: false });
          if (!error && data) {
            return data as Booking[];
          }
        }
      } catch (err) {
        console.warn('Fallback to local store for bookings:', err);
      }
    }
    return store.getBookings(agencyId);
  }

  async createBooking(rawInput: BookingInput): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    // 1. Validation de schéma avec Zod
    const validation = bookingSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues.map((i) => i.message).join(', '),
      };
    }

    const input = validation.data;

    // 2. Vérification anti-chevauchement (Double-booking protection)
    const existingBookings = await this.getBookings();
    const hasOverlap = existingBookings.some((b) => {
      if (b.vehicle_id !== input.vehicleId) return false;
      if (b.status === 'CANCELLED' || b.status === 'REJECTED') return false;
      return doDatesOverlap(input.startDate, input.endDate, b.start_date, b.end_date);
    });

    if (hasOverlap) {
      return {
        success: false,
        error: 'Ce véhicule est déjà réservé pour ces dates. Veuillez sélectionner d’autres dates ou un véhicule alternatif.',
      };
    }

    // 3. Calcul du prix et des jours
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Trouver le véhicule pour le prix
    const vehicles = store.getVehicles();
    const vehicle = vehicles.find((v) => v.id === input.vehicleId);
    const dailyPrice = vehicle?.daily_price || 350;
    const totalPrice = totalDays * dailyPrice;
    const depositAmount = vehicle?.deposit || 3000;
    const bookingRef = `#NRD-${Math.floor(1000 + Math.random() * 9000)}`;

    if (isSupabaseServerConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('bookings')
            .insert({
              booking_ref: bookingRef,
              vehicle_id: input.vehicleId,
              agency_id: input.agencyId,
              customer_name: input.customerName,
              customer_email: input.customerEmail,
              customer_phone: input.customerPhone,
              start_date: input.startDate,
              end_date: input.endDate,
              pickup_time: input.pickupTime,
              dropoff_time: input.dropoffTime,
              pickup_location: input.pickupLocation,
              dropoff_location: input.dropoffLocation,
              total_days: totalDays,
              daily_price: dailyPrice,
              total_price: totalPrice,
              deposit_amount: depositAmount,
              status: 'PENDING',
              notes: input.notes,
            })
            .select('*, vehicle:vehicles(*), agency:agencies(*)')
            .single();

          if (!error && data) {
            return { success: true, booking: data as Booking };
          }
        }
      } catch (err) {
        console.warn('Fallback to local store for createBooking:', err);
      }
    }

    // Fallback mémoire
    const newBooking = store.createBooking({
      booking_ref: bookingRef,
      vehicle_id: input.vehicleId,
      agency_id: input.agencyId,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      start_date: input.startDate,
      end_date: input.endDate,
      pickup_time: input.pickupTime,
      dropoff_time: input.dropoffTime,
      pickup_location: input.pickupLocation,
      dropoff_location: input.dropoffLocation,
      total_days: totalDays,
      daily_price: dailyPrice,
      total_price: totalPrice,
      deposit_amount: depositAmount,
      status: 'PENDING',
      notes: input.notes,
    });

    return { success: true, booking: newBooking };
  }

  async updateBookingStatus(
    id: string,
    status: BookingStatus,
    rejectionReason?: string
  ): Promise<Booking | null> {
    if (isSupabaseServerConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('bookings')
            .update({
              status,
              rejection_reason: rejectionReason,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

          if (!error && data) {
            return data as Booking;
          }
        }
      } catch (err) {
        console.warn('Fallback to store for updateBookingStatus:', err);
      }
    }
    return store.updateBookingStatus(id, status, rejectionReason) || null;
  }
}

export const bookingsService = new BookingsService();
