import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const vehiclesRouter = Router();

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase non configuré dans le backend Express.');
  return createClient(url, key, { auth: { persistSession: false } });
}

function qs(val: unknown): string | undefined {
  if (Array.isArray(val)) return val[0];
  return val as string | undefined;
}

/** GET /api/vehicles */
vehiclesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const q = req.query;

    let query = supabase
      .from('vehicles')
      .select('*, agency:agencies(*), images:vehicle_images(url, is_primary), vehicle_features(name)')
      .eq('published', true);

    if (qs(q.category)) query = query.ilike('category', qs(q.category)!);
    if (qs(q.brand)) query = query.ilike('brand', qs(q.brand)!);
    if (qs(q.transmission)) query = query.eq('transmission', qs(q.transmission)!);
    if (qs(q.fuel)) query = query.eq('fuel', qs(q.fuel)!);
    if (q.minPrice) query = query.gte('daily_price', Number(q.minPrice));
    if (q.maxPrice) query = query.lte('daily_price', Number(q.maxPrice));
    if (qs(q.agencyId)) query = query.eq('agency_id', qs(q.agencyId)!);
    if (qs(q.sortBy) === 'price_asc') query = query.order('daily_price', { ascending: true });
    else if (qs(q.sortBy) === 'price_desc') query = query.order('daily_price', { ascending: false });
    else query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) { res.status(500).json({ success: false, error: error.message }); return; }

    const vehicles = (data ?? []).map((row: any) => ({
      ...row,
      images: Array.isArray(row.images) ? row.images.map((i: any) => i.url) : [],
      features: Array.isArray(row.vehicle_features) ? row.vehicle_features.map((f: any) => f.name) : [],
    }));

    const total = vehicles.length;
    const offset = q.offset ? Number(q.offset) : 0;
    const limit = q.limit ? Number(q.limit) : total;
    res.json({ success: true, data: vehicles.slice(offset, offset + limit), meta: { total, limit, offset } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message ?? 'Erreur serveur' });
  }
});

/** GET /api/vehicles/:slug */
vehiclesRouter.get('/:slug', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, agency:agencies(*), images:vehicle_images(url, is_primary), vehicle_features(name)')
      .eq('slug', req.params.slug)
      .maybeSingle();

    if (error) { res.status(500).json({ success: false, error: error.message }); return; }
    if (!data) { res.status(404).json({ success: false, error: 'Véhicule introuvable' }); return; }

    res.json({ success: true, data: {
      ...data,
      images: Array.isArray(data.images) ? data.images.map((i: any) => i.url) : [],
      features: Array.isArray(data.vehicle_features) ? data.vehicle_features.map((f: any) => f.name) : [],
    }});
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message ?? 'Erreur serveur' });
  }
});

/** PATCH /api/vehicles/:id */
vehiclesRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('vehicles')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) { res.status(404).json({ success: false, error: error.message }); return; }
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message ?? 'Erreur serveur' });
  }
});

/** DELETE /api/vehicles/:id */
vehiclesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('vehicles').delete().eq('id', req.params.id);
    if (error) { res.status(404).json({ success: false, error: error.message }); return; }
    res.json({ success: true, message: 'Véhicule supprimé' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message ?? 'Erreur serveur' });
  }
});
