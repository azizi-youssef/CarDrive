import { z } from 'zod';

export const VEHICLE_CATEGORIES = [
  'Économique',
  'SUV',
  'Berline',
  'Luxe',
  '7 places',
  'Automatique',
  'Citadine',
  'Compacte',
] as const;

export const TRANSMISSION_TYPES = ['MANUAL', 'AUTOMATIC'] as const;
export const FUEL_TYPES = ['DIESEL', 'GASOLINE', 'HYBRID', 'ELECTRIC'] as const;
export const VEHICLE_STATUSES = ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'BLOCKED'] as const;

export const vehicleCreateSchema = z.object({
  brand: z.string().trim().min(2, 'La marque doit comporter au moins 2 caractères'),
  model: z.string().trim().min(1, 'Le modèle est requis'),
  year: z.coerce
    .number()
    .int()
    .min(2000, 'Année minimale: 2000')
    .max(new Date().getFullYear() + 1, 'Année invalide'),
  category: z.enum(VEHICLE_CATEGORIES),
  transmission: z.enum(TRANSMISSION_TYPES),
  fuel: z.enum(FUEL_TYPES),
  seats: z.coerce.number().int().min(2).max(9).default(5),
  doors: z.coerce.number().int().min(2).max(5).default(5),
  air_conditioning: z.coerce.boolean().default(true),
  mileage: z.coerce.number().int().min(0, 'Le kilométrage doit être positif').default(0),
  daily_price: z.coerce.number().positive('Le tarif journalier doit être supérieur à 0'),
  weekly_price: z.coerce.number().positive().optional().nullable(),
  monthly_price: z.coerce.number().positive().optional().nullable(),
  deposit: z.coerce.number().min(0, 'La caution ne peut pas être négative').default(3000),
  min_rental_days: z.coerce.number().int().min(1, 'Durée minimale: 1 jour').default(1),
  status: z.enum(VEHICLE_STATUSES).default('AVAILABLE'),
  published: z.coerce.boolean().default(true),
  license_plate: z.string().trim().optional().default(''),
  unit_number: z.string().trim().optional().default(''),
  images: z.array(z.string().url('URL image invalide')).default([]),
  features: z.array(z.string().trim()).default([]),
});

export const vehicleUpdateSchema = vehicleCreateSchema.partial();

export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;
