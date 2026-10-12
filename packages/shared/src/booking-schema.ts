import { z } from 'zod';
import { BOOKING_STATUSES, type BookingStatus } from './booking-status';

export const deliveryTypeEnum = z.enum(['AGENCY_PICKUP', 'AIRPORT', 'HOTEL', 'ADDRESS']);

export const bookingRequestSchema = z
  .object({
    vehicleId: z.string().min(1, 'Identifiant véhicule requis'),
    agencyId: z.string().min(1, 'Identifiant agence requis'),
    firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
    lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    cin: z.string().min(3, 'Numéro de CIN ou Passeport requis'),
    phone: z.string().min(8, 'Numéro de téléphone valide requis'),
    email: z.string().email('Adresse email valide').optional().or(z.literal('')),
    country: z.string().min(2, 'Pays de résidence requis').default('Maroc'),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de naissance requise (AAAA-MM-JJ)'),
    licenseNumber: z.string().min(3, 'Numéro de permis de conduire requis'),
    licenseExpiry: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date d'expiration du permis requise (AAAA-MM-JJ)"),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de prise en charge requise'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de restitution requise'),
    pickupTime: z.string().default('10:00'),
    dropoffTime: z.string().default('10:00'),
    deliveryType: deliveryTypeEnum.default('AIRPORT'),
    pickupLocation: z.string().min(2, 'Lieu de prise en charge requis'),
    dropoffLocation: z.string().min(2, 'Lieu de restitution requis'),
    flightNumber: z.string().optional(),
    flightArrivalTime: z.string().optional(),
    childSeat: z.boolean().default(false),
    additionalDriver: z.boolean().default(false),
    customerNotes: z.string().optional(),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'La date de retour doit être égale ou postérieure à la date de début',
    path: ['endDate'],
  })
  .refine((data) => new Date(data.licenseExpiry) >= new Date(data.endDate), {
    message: 'Le permis de conduire doit être valide pendant toute la durée de la location',
    path: ['licenseExpiry'],
  });

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;

const bookingStatusEnum = z.enum(
  BOOKING_STATUSES as unknown as [BookingStatus, ...BookingStatus[]]
);

export const bookingStatusUpdateSchema = z.object({
  status: bookingStatusEnum,
  rejectionReason: z.string().optional(),
});

export const agencyBookingActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'propose_alternative']),
  notes: z.string().optional(),
  reason: z.string().optional(),
  alternativeVehicleId: z.string().optional(),
});
