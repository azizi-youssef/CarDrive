import { Vehicle, SearchFilters } from '@/types';
import { store } from './store';
import { createClient, isSupabaseServerConfigured } from '@/lib/supabase/server';
import { isVehicleAvailable, findSameModelAlternatives } from '@/lib/availability/engine';

export class VehiclesService {
  async getVehicles(filters?: SearchFilters): Promise<Vehicle[]> {
    if (isSupabaseServerConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          let query = supabase
            .from('vehicles')
            .select('*, agency:agencies(*), images:vehicle_images(url, is_primary)')
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
          if (!error && data) {
            const mapped: Vehicle[] = data.map((row: any) => ({
              ...row,
              images: Array.isArray(row.images) && row.images.length > 0 
                ? row.images.map((img: any) => img.url)
                : row.images || [],
              features: row.features || ['Climatisation', 'Bluetooth', 'Assurance incluse'],
            }));

            // Filter by date availability if dates provided
            if (filters?.startDate && filters?.endDate) {
              const allBookings = store.getBookings(); // or Supabase bookings query
              return mapped.filter((v) => isVehicleAvailable(v, allBookings, filters.startDate, filters.endDate));
            }

            return mapped;
          }
        }
      } catch (err) {
        console.warn('Fallback to local store for vehicles:', err);
      }
    }
    return store.getVehicles(filters);
  }

  async getVehicleBySlug(slug: string): Promise<Vehicle | null> {
    if (isSupabaseServerConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('vehicles')
            .select('*, agency:agencies(*), images:vehicle_images(url, is_primary)')
            .eq('slug', slug)
            .single();

          if (!error && data) {
            return {
              ...data,
              images: Array.isArray(data.images) && data.images.length > 0 
                ? data.images.map((img: any) => img.url)
                : data.images || [],
              features: data.features || ['Climatisation', 'Bluetooth', 'Assurance incluse'],
            } as Vehicle;
          }
        }
      } catch (err) {
        console.warn('Fallback to local store for vehicle slug:', err);
      }
    }
    return store.getVehicleBySlug(slug) || null;
  }

  async getVehicleById(id: string): Promise<Vehicle | null> {
    const vehicles = await this.getVehicles();
    return vehicles.find((v) => v.id === id) || null;
  }

  async getAlternatives(vehicle: Vehicle, startDate?: string, endDate?: string): Promise<Vehicle[]> {
    const allVehicles = await this.getVehicles();
    const allBookings = store.getBookings();

    return findSameModelAlternatives({
      currentVehicle: vehicle,
      allVehicles,
      allBookings,
      startDate,
      endDate,
    });
  }

  async addVehicle(newCar: Omit<Vehicle, 'id' | 'created_at'>): Promise<Vehicle> {
    if (isSupabaseServerConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
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

          if (!error && data) {
            return {
              ...data,
              images: newCar.images,
              features: newCar.features,
            } as Vehicle;
          }
        }
      } catch (err) {
        console.warn('Fallback to store for addVehicle:', err);
      }
    }
    return store.addVehicle(newCar);
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> {
    if (isSupabaseServerConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('vehicles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

          if (!error && data) {
            return data as Vehicle;
          }
        }
      } catch (err) {
        console.warn('Fallback to store for updateVehicle:', err);
      }
    }
    return store.updateVehicle(id, updates) || null;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    if (isSupabaseServerConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { error } = await supabase.from('vehicles').delete().eq('id', id);
          if (!error) return true;
        }
      } catch (err) {
        console.warn('Fallback to store for deleteVehicle:', err);
      }
    }
    return store.deleteVehicle(id);
  }
}

export const vehiclesService = new VehiclesService();
