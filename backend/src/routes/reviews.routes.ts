import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const reviewsRouter = Router();

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase non configuré dans le backend Express.');
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * GET /api/reviews?vehicleId=&agencyId=
 */
reviewsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { vehicleId, agencyId } = req.query;

    let query = supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId as string);
    } else if (agencyId) {
      query = query.eq('agency_id', agencyId as string);
    } else {
      res.status(400).json({ success: false, error: 'Paramètre vehicleId ou agencyId requis' });
      return;
    }

    const { data, error } = await query;
    if (error) { res.status(500).json({ success: false, error: error.message }); return; }

    const reviews = data ?? [];
    res.json({ success: true, data: reviews, meta: { total: reviews.length } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message ?? 'Erreur serveur' });
  }
});

/**
 * POST /api/reviews
 * Body: { vehicleId, agencyId, authorName, rating, comment }
 */
reviewsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { vehicleId, agencyId, authorName, rating, comment } = req.body;

    if (!vehicleId || !agencyId || !authorName || !rating || !comment) {
      res.status(400).json({ success: false, error: 'Champs requis : vehicleId, agencyId, authorName, rating, comment' });
      return;
    }
    if (rating < 1 || rating > 5) {
      res.status(400).json({ success: false, error: 'La note doit être comprise entre 1 et 5' });
      return;
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        vehicle_id: vehicleId,
        agency_id: agencyId,
        author_name: authorName,
        rating: Number(rating),
        comment,
      })
      .select()
      .single();

    if (error) { res.status(500).json({ success: false, error: error.message }); return; }
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message ?? 'Erreur serveur' });
  }
});
