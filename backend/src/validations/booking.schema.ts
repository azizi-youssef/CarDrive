import { z } from 'zod';

/** Création Express (compat mock / sync dev) — champs souples. */
export const bookingSchema = z
  .object({
    vehicleId: z.string().min(1, 'Identifiant véhicule requis'),
    agencyId: z.string().min(1, 'Identifiant agence requis'),
    customerName: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    customerEmail: z.string().email().optional(),
    email: z.string().email().optional(),
    customerPhone: z.string().optional(),
    phone: z.string().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de début invalide (YYYY-MM-DD)'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de fin invalide (YYYY-MM-DD)'),
    pickupTime: z.string().default('10:00').optional(),
    dropoffTime: z.string().default('10:00').optional(),
    pickupLocation: z.string().min(2, 'Lieu de prise en charge requis'),
    dropoffLocation: z.string().min(2, 'Lieu de restitution requis'),
    notes: z.string().optional(),
    customerNotes: z.string().optional(),
    reference: z.string().optional(),
    cin: z.string().optional(),
  })
  .passthrough()
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'La date de retour doit être égale ou postérieure à la date de départ',
    path: ['endDate'],
  });

export type BookingInput = z.infer<typeof bookingSchema>;

export const bookingStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'ACTIVE', 'COMPLETED', 'NO_SHOW']),
  reason: z.string().optional(),
});
