import { z } from 'zod';

export const bookingSchema = z.object({
  vehicleId: z.string().min(1, 'Identifiant véhicule requis'),
  agencyId: z.string().min(1, 'Identifiant agence requis'),
  customerName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  customerEmail: z.string().email('Adresse email invalide'),
  customerPhone: z.string().min(9, 'Numéro de téléphone requis (ex: 0612345678)'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de début invalide (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de fin invalide (YYYY-MM-DD)'),
  pickupTime: z.string().default('10:00'),
  dropoffTime: z.string().default('10:00'),
  pickupLocation: z.string().min(2, 'Lieu de prise en charge requis'),
  dropoffLocation: z.string().min(2, 'Lieu de restitution requis'),
  notes: z.string().optional(),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: 'La date de retour doit être égale ou postérieure à la date de départ',
  path: ['endDate'],
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const bookingStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'ACTIVE', 'COMPLETED', 'NO_SHOW']),
  rejectionReason: z.string().optional(),
});
