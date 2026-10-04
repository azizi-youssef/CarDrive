import { Router, Request, Response } from 'express';
import { store } from '../services/store';

export const agenciesRouter = Router();

function qs(val: unknown): string | undefined {
  if (Array.isArray(val)) return val[0];
  return val as string | undefined;
}

/** GET /api/agencies */
agenciesRouter.get('/', (req: Request, res: Response) => {
  const onlyActive = req.query.onlyActive !== 'false';
  const agencies = store.getAgencies(onlyActive);
  res.json({ success: true, data: agencies, meta: { total: agencies.length } });
});

/** GET /api/agencies/:slug */
agenciesRouter.get('/:slug', (req: Request, res: Response) => {
  const agency = store.getAgencyBySlug(req.params.slug as string);
  if (!agency) { res.status(404).json({ success: false, error: 'Agence introuvable' }); return; }
  const vehicleCount = store.getVehicles({ agencyId: agency.id }).length;
  res.json({ success: true, data: { ...agency, vehicleCount } });
});

/** GET /api/agencies/:slug/vehicles */
agenciesRouter.get('/:slug/vehicles', (req: Request, res: Response) => {
  const agency = store.getAgencyBySlug(req.params.slug as string);
  if (!agency) { res.status(404).json({ success: false, error: 'Agence introuvable' }); return; }
  const vehicles = store.getVehicles({ agencyId: agency.id });
  res.json({ success: true, data: vehicles, meta: { total: vehicles.length } });
});

/** PATCH /api/agencies/:id/status */
agenciesRouter.patch('/:id/status', (req: Request, res: Response) => {
  const { status, verified } = req.body;
  if (!status) { res.status(400).json({ success: false, error: 'Champ status requis' }); return; }
  const updated = store.updateAgencyStatus(req.params.id as string, status, verified ?? false);
  if (!updated) { res.status(404).json({ success: false, error: 'Agence introuvable' }); return; }
  res.json({ success: true, data: updated });
});
