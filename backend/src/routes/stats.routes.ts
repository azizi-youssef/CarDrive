import { Router, Request, Response } from 'express';
import { store } from '../services/store';

export const statsRouter = Router();

/** GET /api/stats/admin */
statsRouter.get('/admin', (_req: Request, res: Response) => {
  const stats = store.getAdminStats();
  res.json({ success: true, data: stats });
});

/** GET /api/stats/agency/:id */
statsRouter.get('/agency/:id', (req: Request, res: Response) => {
  const agency = store.getAgencyById(req.params.id as string);
  if (!agency) { res.status(404).json({ success: false, error: 'Agence introuvable' }); return; }
  const stats = store.getAgencyStats(req.params.id as string);
  res.json({ success: true, data: stats });
});
