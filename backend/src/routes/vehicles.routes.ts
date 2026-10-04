import { Router, Request, Response } from 'express';
import { store } from '../services/store';

export const vehiclesRouter = Router();

function qs(val: unknown): string | undefined {
  if (Array.isArray(val)) return val[0];
  return val as string | undefined;
}

/** GET /api/vehicles */
vehiclesRouter.get('/', (req: Request, res: Response) => {
  try {
    const q = req.query;
    const vehicles = store.getVehicles({
      category: qs(q.category),
      brand: qs(q.brand),
      transmission: qs(q.transmission) as 'MANUAL' | 'AUTOMATIC' | undefined,
      fuel: qs(q.fuel) as 'DIESEL' | 'GASOLINE' | 'HYBRID' | 'ELECTRIC' | undefined,
      minPrice: q.minPrice ? Number(q.minPrice) : undefined,
      maxPrice: q.maxPrice ? Number(q.maxPrice) : undefined,
      agencyId: qs(q.agencyId),
      query: qs(q.query),
      startDate: qs(q.startDate),
      endDate: qs(q.endDate),
      sortBy: qs(q.sortBy) as 'price_asc' | 'price_desc' | 'rating' | 'newest' | undefined,
    });

    const total = vehicles.length;
    const pageOffset = q.offset ? Number(q.offset) : 0;
    const pageLimit = q.limit ? Number(q.limit) : total;
    const paginated = vehicles.slice(pageOffset, pageOffset + pageLimit);

    res.json({ success: true, data: paginated, meta: { total, limit: pageLimit, offset: pageOffset } });
  } catch {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/** GET /api/vehicles/:slug */
vehiclesRouter.get('/:slug', (req: Request, res: Response) => {
  const vehicle = store.getVehicleBySlug(req.params.slug as string);
  if (!vehicle) { res.status(404).json({ success: false, error: 'Véhicule introuvable' }); return; }
  res.json({ success: true, data: vehicle });
});

/** POST /api/vehicles */
vehiclesRouter.post('/', (req: Request, res: Response) => {
  try {
    const vehicle = store.addVehicle(req.body);
    res.status(201).json({ success: true, data: vehicle });
  } catch {
    res.status(400).json({ success: false, error: 'Données invalides' });
  }
});

/** PATCH /api/vehicles/:id */
vehiclesRouter.patch('/:id', (req: Request, res: Response) => {
  const updated = store.updateVehicle(req.params.id as string, req.body);
  if (!updated) { res.status(404).json({ success: false, error: 'Véhicule introuvable' }); return; }
  res.json({ success: true, data: updated });
});

/** DELETE /api/vehicles/:id */
vehiclesRouter.delete('/:id', (req: Request, res: Response) => {
  const deleted = store.deleteVehicle(req.params.id as string);
  if (!deleted) { res.status(404).json({ success: false, error: 'Véhicule introuvable' }); return; }
  res.json({ success: true, message: 'Véhicule supprimé' });
});
