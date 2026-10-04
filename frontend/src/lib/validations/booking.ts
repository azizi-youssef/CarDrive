import { z } from 'zod';

export const bookingSchema = z.object({
  vehicleId: z.string().uuid({ message: 'Identifiant véhicule invalide' }).or(z.string().min(1)),
  agencyId: z.string().uuid({ message: 'Identifiant agence invalide' }).or(z.string().min(1)),
  customerName: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
  customerEmail: z.string().email({ message: 'Adresse email invalide' }),
  customerPhone: z.string().min(9, { message: 'Numéro de téléphone requis (ex: 0612345678)' }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date de début invalide (YYYY-MM-DD)' }),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date de fin invalide (YYYY-MM-DD)' }),
  pickupTime: z.string().default('10:00'),
  dropoffTime: z.string().default('10:00'),
  pickupLocation: z.string().min(2, { message: 'Lieu de prise en charge requis' }),
  dropoffLocation: z.string().min(2, { message: 'Lieu de restitution requis' }),
  notes: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: 'La date de retour doit être égale ou postérieure à la date de départ',
  path: ['endDate'],
});

export type BookingInput = z.infer<typeof bookingSchema>;
