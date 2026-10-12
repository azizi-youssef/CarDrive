import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const agenciesRouter = Router();

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

/** GET /api/agencies */
agenciesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const onlyActive = req.query.onlyActive !== 'false';

    let query = supabase
      .from('agencies')
      .select('*, vehicle_count:vehicles(count)');

    if (onlyActive) query = query.eq('status', 'ACTIVE');

    const { data, error } = await query.order('rating', { ascending: false });
    if (error) { res.status(500).json({ success: false, error: error.message }); return; }

    const agencies = (data ?? []).map((a: any) => ({
      ...a,
      vehicle_count: a.vehicle_count?.[0]?.count ?? 0,
    }));

    res.json({ success: true, data: agencies, meta: { total: agencies.length } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message ?? 'Erreur serveur' });
  }
});

/** GET /api/agencies/:slug */
agenciesRouter.get('/:slug', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .eq('slug', req.params.slug)
      .maybeSingle();

    if (error) { res.status(500).json({ success: false, error: error.message }); return; }
    if (!data) { res.status(404).json({ success: false, error: 'Agence introuvable' }); return; }

    // Compter les véhicules de cette agence
    const { count } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', data.id);

    res.json({ success: true, data: { ...data, vehicle_count: count ?? 0 } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message ?? 'Erreur serveur' });
  }
});

/** GET /api/agencies/:slug/vehicles */
agenciesRouter.get('/:slug/vehicles', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();

    // Résoudre l'agence par slug
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id')
      .eq('slug', req.params.slug)
      .maybeSingle();

    if (agencyError) { res.status(500).json({ success: false, error: agencyError.message }); return; }
    if (!agency) { res.status(404).json({ success: false, error: 'Agence introuvable' }); return; }

    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*, images:vehicle_images(url, is_primary), vehicle_features(name)')
      .eq('agency_id', agency.id)
      .eq('published', true)
      .order('featured', { ascending: false });

    if (vehiclesError) { res.status(500).json({ success: false, error: vehiclesError.message }); return; }

    const mapped = (vehicles ?? []).map((v: any) => ({
      ...v,
      images: Array.isArray(v.images) ? v.images.map((i: any) => i.url) : [],
      features: Array.isArray(v.vehicle_features) ? v.vehicle_features.map((f: any) => f.name) : [],
    }));

    res.json({ success: true, data: mapped, meta: { total: mapped.length } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message ?? 'Erreur serveur' });
  }
});

/** PATCH /api/agencies/:id/status */
agenciesRouter.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { status, verified } = req.body;
    if (!status) { res.status(400).json({ success: false, error: 'Champ status requis' }); return; }

    const { data, error } = await supabase
      .from('agencies')
      .update({ status, verified: verified ?? false, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) { res.status(404).json({ success: false, error: error.message }); return; }
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message ?? 'Erreur serveur' });
  }
});
