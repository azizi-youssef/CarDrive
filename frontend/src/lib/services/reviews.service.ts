import { Review } from '@/types';
import { store } from './store';
import { createClient, isSupabaseServerConfigured } from '@/lib/supabase/server';

export class ReviewsService {
  async getReviewsForVehicle(vehicleId: string): Promise<Review[]> {
    if (isSupabaseServerConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('vehicle_id', vehicleId)
            .order('created_at', { ascending: false });

          if (!error && data) {
            return data as Review[];
          }
        }
      } catch (err) {
        console.warn('Fallback to store for reviews:', err);
      }
    }
    return store.getReviewsForVehicle(vehicleId);
  }

  async addReview(review: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    if (isSupabaseServerConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('reviews')
            .insert(review)
            .select()
            .single();

          if (!error && data) {
            return data as Review;
          }
        }
      } catch (err) {
        console.warn('Fallback to store for addReview:', err);
      }
    }
    return store.addReview(review);
  }
}

export const reviewsService = new ReviewsService();
