import { Router, Request, Response } from 'express';
import { store } from '../services/store';

export const reviewsRouter = Router();

/**
 * GET /api/reviews?vehicleId=&agencyId=
 */
reviewsRouter.get('/', (req: Request, res: Response) => {
  const { vehicleId, agencyId } = req.query;
  if (vehicleId) {
    const reviews = store.getReviewsForVehicle(vehicleId as string);
    res.json({ success: true, data: reviews, meta: { total: reviews.length } });
    return;
  }
  if (agencyId) {
    const reviews = store.getReviewsForAgency(agencyId as string);
    res.json({ success: true, data: reviews, meta: { total: reviews.length } });
    return;
  }
  res.status(400).json({ success: false, error: 'Paramètre vehicleId ou agencyId requis' });
});

/**
 * POST /api/reviews
 * Body: { vehicleId, agencyId, authorName, rating, comment }
 */
reviewsRouter.post('/', (req: Request, res: Response) => {
  const { vehicleId, agencyId, authorName, rating, comment } = req.body;

  if (!vehicleId || !agencyId || !authorName || !rating || !comment) {
    res.status(400).json({ success: false, error: 'Champs requis : vehicleId, agencyId, authorName, rating, comment' });
    return;
  }

  if (rating < 1 || rating > 5) {
    res.status(400).json({ success: false, error: 'La note doit être comprise entre 1 et 5' });
    return;
  }

  const review = store.addReview({
    vehicle_id: vehicleId,
    agency_id: agencyId,
    author_name: authorName,
    rating: Number(rating),
    comment,
  });

  res.status(201).json({ success: true, data: review });
});
