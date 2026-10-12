import { Vehicle, SearchFilters } from '@/types';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { isVehicleAvailable, findSameModelAlternatives } from '@/lib/availability/engine';
import { isBlockingBookingStatus } from '@cardrive/shared';

function requireSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !url.startsWith('http')) {
    throw new Error(
      'Supabase non configuré. Définissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
}

/** Normalise les résultats Supabase vers le type Vehicle attendu */
function normalizeVehicle(row: any): Vehicle {
  return {
    ...row,
    images:
      Array.isArray(row.images) && row.images.length > 0
        ? row.images.map((img: any) => img.url)
        : [],
    features:
      Array.isArray(row.vehicle_features) && row.vehicle_features.length > 0
        ? row.vehicle_features.map((f: any) => f.name as string)
        : Array.isArray(row.features) && row.features.length > 0
        ? row.features
        : [],
  };
}

export class VehiclesService {
  async getVehicles(filters?: SearchFilters): Promise<Vehicle[]> {
    requireSupabase();
    const supabase = (await createAdminClient()) ?? (await createClient());
    if (!supabase) throw new Error('Client Supabase indisponible.');

    let query = supabase
      .from('vehicles')
      .select('*, agency:agencies(*), images:vehicle_images(url, is_primary), vehicle_features(name)')
      .eq('published', true);

    if (filters?.agencyId) {
      query = query.eq('agency_id', filters.agencyId);
    }
    if (filters?.category && filters.category !== 'Tous les types') {
      query = query.ilike('category', filters.category);
    }
    if (filters?.brand) {
      query = query.ilike('brand', filters.brand);
    }
    if (filters?.transmission) {
      query = query.eq('transmission', filters.transmission);
    }
    if (filters?.fuel) {
      query = query.eq('fuel', filters.fuel);
    }
    if (filters?.minPrice) {
      query = query.gte('daily_price', filters.minPrice);
    }
    if (filters?.maxPrice) {
      query = query.lte('daily_price', filters.maxPrice);
    }

    if (filters?.sortBy === 'price_asc') {
      query = query.order('daily_price', { ascending: true });
    } else if (filters?.sortBy === 'price_desc') {
      query = query.order('daily_price', { ascending: false });
    } else {
      query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      console.error('[VehiclesService] getVehicles error:', error.message);
      throw new Error('Impossible de charger les véhicules.');
    }

    const mapped: Vehicle[] = (data ?? []).map(normalizeVehicle);

    // Filtrage par disponibilité si des dates sont fournies
    if (filters?.startDate && filters?.endDate) {
      const { data: bData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, vehicle_id, start_date, end_date, status')
        .in('status', ['CONFIRMED', 'ACTIVE', 'PENDING', 'REQUESTED', 'UNDER_REVIEW', 'SENT_TO_AGENCY', 'AGENCY_REVIEW', 'APPROVED', 'READY_FOR_PICKUP'])
        .lte('start_date', filters.endDate)
        .gte('end_date', filters.startDate);

      if (bookingsError) {
        console.error('[VehiclesService] Availability lookup failed:', bookingsError.message);
        throw new Error('Impossible de vérifier la disponibilité des véhicules.');
      }
      const allBookings = (bData ?? []) as any[];
      return mapped.filter((v) => isVehicleAvailable(v, allBookings, filters.startDate, filters.endDate));
    }

    return mapped;
  }

  async getVehicleBySlug(slug: string): Promise<Vehicle | null> {
    requireSupabase();
    const supabase = (await createAdminClient()) ?? (await createClient());
    if (!supabase) throw new Error('Client Supabase indisponible.');

    const { data, error } = await supabase
      .from('vehicles')
      .select('*, agency:agencies(*), images:vehicle_images(url, is_primary), vehicle_features(name)')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('[VehiclesService] getVehicleBySlug error:', error.message);
      throw new Error('Impossible de charger le véhicule.');
    }
    return data ? normalizeVehicle(data) : null;
  }

  async getVehicleById(id: string): Promise<Vehicle | null> {
    requireSupabase();
    const supabase = (await createAdminClient()) ?? (await createClient());
    if (!supabase) throw new Error('Client Supabase indisponible.');

    const { data, error } = await supabase
      .from('vehicles')
      .select('*, agency:agencies(*), images:vehicle_images(url, is_primary), vehicle_features(name)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[VehiclesService] getVehicleById error:', error.message);
      throw new Error('Impossible de charger le véhicule.');
    }
    return data ? normalizeVehicle(data) : null;
  }

  async getAlternatives(
    vehicle: Vehicle,
    startDate?: string,
    endDate?: string
  ): Promise<Vehicle[]> {
    requireSupabase();
    const allVehicles = await this.getVehicles();
    const supabase = (await createAdminClient()) ?? (await createClient());
    let allBookings: any[] = [];

    if (supabase) {
      const { data } = await supabase
        .from('bookings')
        .select('id, vehicle_id, start_date, end_date, status')
        .in('status', ['CONFIRMED', 'ACTIVE', 'PENDING', 'REQUESTED', 'UNDER_REVIEW', 'SENT_TO_AGENCY', 'AGENCY_REVIEW', 'APPROVED', 'READY_FOR_PICKUP']);
      if (data) allBookings = data;
    }

    return findSameModelAlternatives({
      currentVehicle: vehicle,
      allVehicles,
      allBookings,
      startDate,
      endDate,
    });
  }

  async addVehicle(newCar: Omit<Vehicle, 'id' | 'created_at'>): Promise<Vehicle> {
    requireSupabase();
    const supabase = (await createAdminClient()) ?? (await createClient());
    if (!supabase) throw new Error('Client Supabase indisponible.');

    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        agency_id: newCar.agency_id,
        unit_number: newCar.unit_number,
        license_plate: newCar.license_plate,
        brand: newCar.brand,
        model: newCar.model,
        slug: newCar.slug,
        year: newCar.year,
        category: newCar.category,
        transmission: newCar.transmission,
        fuel: newCar.fuel,
        seats: newCar.seats,
        doors: newCar.doors,
        air_conditioning: newCar.air_conditioning,
        mileage: newCar.mileage,
        daily_price: newCar.daily_price,
        weekly_price: newCar.weekly_price,
        monthly_price: newCar.monthly_price,
        deposit: newCar.deposit,
        min_rental_days: newCar.min_rental_days,
        status: newCar.status,
        published: newCar.published,
        featured: newCar.featured,
      })
      .select('*, agency:agencies(*)')
      .single();

    if (error) {
      console.error('[VehiclesService] addVehicle error:', error.message);
      throw new Error('Impossible d\'ajouter le véhicule.');
    }
    return { ...data, images: newCar.images, features: newCar.features } as Vehicle;
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> {
    requireSupabase();
    const supabase = (await createAdminClient()) ?? (await createClient());
    if (!supabase) throw new Error('Client Supabase indisponible.');

    const { data, error } = await supabase
      .from('vehicles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[VehiclesService] updateVehicle error:', error.message);
      throw new Error('Impossible de mettre à jour le véhicule.');
    }
    return data as Vehicle;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    requireSupabase();
    const supabase = (await createAdminClient()) ?? (await createClient());
    if (!supabase) throw new Error('Client Supabase indisponible.');

    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) {
      console.error('[VehiclesService] deleteVehicle error:', error.message);
      throw new Error('Impossible de supprimer le véhicule.');
    }
    return true;
  }
}

export const vehiclesService = new VehiclesService();
