import { Review } from '@/types';
import { createClient, createAdminClient } from '@/lib/supabase/server';

function requireSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !url.startsWith('http')) {
    throw new Error(
      'Supabase non configuré. Définissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
}

export class ReviewsService {
  async getReviewsForVehicle(vehicleId: string): Promise<Review[]> {
    requireSupabase();
    const supabase = (await createAdminClient()) ?? (await createClient());
    if (!supabase) throw new Error('Client Supabase indisponible.');

    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ReviewsService] getReviewsForVehicle error:', error.message);
      throw new Error('Impossible de charger les avis.');
    }
    return (data ?? []) as Review[];
  }

  async addReview(
    review: Omit<Review, 'id' | 'created_at'> & {
      booking_id: string;
      customer_id: string;
    }
  ): Promise<Review> {
    requireSupabase();
    const supabase = await createClient();
    if (!supabase) throw new Error('Client Supabase indisponible.');

    const { data, error } = await supabase
      .from('reviews')
      .insert(review)
      .select()
      .single();

    if (error) {
      console.error('[ReviewsService] addReview error:', error.message);
      throw new Error('Impossible d\'ajouter l\'avis.');
    }
    return data as Review;
  }
}

export const reviewsService = new ReviewsService();
