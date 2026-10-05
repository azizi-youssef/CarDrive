import { z } from 'zod';

export const deliveryTypeEnum = z.enum(['AGENCY_PICKUP', 'AIRPORT', 'HOTEL', 'ADDRESS']);

export const bookingRequestSchema = z.object({
  // Véhicule et Agence
  vehicleId: z.string().min(1, 'Identifiant véhicule requis'),
  agencyId: z.string().min(1, 'Identifiant agence requis'),

  // Informations Client
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  cin: z.string().min(3, 'Numéro de CIN ou Passeport requis (ex: S123456 ou 12AB34567)'),
  phone: z.string().min(8, 'Numéro de téléphone valide requis'),
  email: z.string().email('Adresse email valide').optional().or(z.literal('')),
  country: z.string().min(2, 'Pays de résidence requis').default('Maroc'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de naissance requise (AAAA-MM-JJ)'),
  licenseNumber: z.string().min(3, 'Numéro de permis de conduire requis'),
  licenseExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date d\'expiration du permis requise (AAAA-MM-JJ)'),

  // Période et Horaires
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de prise en charge requise'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de restitution requise'),
  pickupTime: z.string().default('10:00'),
  dropoffTime: z.string().default('10:00'),

  // Lieux et livraison
  deliveryType: deliveryTypeEnum.default('AIRPORT'),
  pickupLocation: z.string().min(2, 'Lieu de prise en charge requis'),
  dropoffLocation: z.string().min(2, 'Lieu de restitution requis'),

  // Options complémentaires
  flightNumber: z.string().optional(),
  flightArrivalTime: z.string().optional(),
  childSeat: z.boolean().default(false),
  additionalDriver: z.boolean().default(false),
  customerNotes: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: 'La date de retour doit être égale ou postérieure à la date de début',
  path: ['endDate'],
}).refine((data) => {
  const expiry = new Date(data.licenseExpiry);
  const end = new Date(data.endDate);
  // Le permis ne doit pas expirer avant la fin de location
  return expiry >= end;
}, {
  message: 'Le permis de conduire doit être valide pendant toute la durée de la location',
  path: ['licenseExpiry'],
});

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;

// Rétrocompatibilité avec l'ancien schéma simplifié si nécessaire
export const bookingSchema = z.object({
  vehicleId: z.string().min(1),
  agencyId: z.string().min(1),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(8),
  startDate: z.string(),
  endDate: z.string(),
  pickupTime: z.string().default('10:00'),
  dropoffTime: z.string().default('10:00'),
  pickupLocation: z.string(),
  dropoffLocation: z.string(),
  notes: z.string().optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
