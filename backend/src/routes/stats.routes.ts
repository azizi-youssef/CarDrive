import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const statsRouter = Router();

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase non configuré dans le backend Express.');
  return createClient(url, key, { auth: { persistSession: false } });
}

/** GET /api/stats/admin */
statsRouter.get('/admin', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('admin_platform_statistics');
    if (error) { res.status(500).json({ success: false, error: error.message }); return; }
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message ?? 'Erreur serveur' });
  }
});

/** GET /api/stats/agency/:id */
statsRouter.get('/agency/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();

    // Vérifier que l'agence existe
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id')
      .eq('id', req.params.id)
      .maybeSingle();

    if (agencyError) { res.status(500).json({ success: false, error: agencyError.message }); return; }
    if (!agency) { res.status(404).json({ success: false, error: 'Agence introuvable' }); return; }

    const { data, error } = await supabase.rpc('agency_report_statistics', {
      p_agency_id: req.params.id,
    });

    if (error) { res.status(500).json({ success: false, error: error.message }); return; }
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message ?? 'Erreur serveur' });
  }
});
