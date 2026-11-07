import type { Vehicle } from '@/types';

/**
 * Projection publique d'un véhicule (catalogue, fiche, API publique, HTML préchargé).
 * Les champs internes de l'agence ne quittent jamais le serveur : plaque d'immatriculation,
 * numéro d'unité interne et documents du véhicule (assurance, carte grise…).
 */
export const PRIVATE_VEHICLE_FIELDS = ['license_plate', 'unit_number', 'documents'] as const;

export function toPublicVehicle<T extends Vehicle>(vehicle: T): T {
  const copy: Record<string, unknown> = { ...(vehicle as unknown as Record<string, unknown>) };
  for (const field of PRIVATE_VEHICLE_FIELDS) delete copy[field];
  // Le type Vehicle exige ces champs (chaînes) : valeurs vides, jamais les vraies données
  copy.license_plate = '';
  copy.unit_number = '';
  return copy as unknown as T;
}

export function toPublicVehicles<T extends Vehicle>(vehicles: T[]): T[] {
  return vehicles.map(toPublicVehicle);
}
