import { z } from 'zod';

const bookingIdPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const reviewInputSchema = z.object({
  booking_id: z.string().trim().regex(bookingIdPattern, 'Identifiant de réservation invalide.'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(5).max(2000),
}).strict();
