import { cache } from 'react';
import { vehiclesService } from '@/lib/services/vehicles.service';
import { findSameModelAlternatives } from '@/lib/availability/engine';
import { toPublicVehicle, toPublicVehicles } from '@/lib/vehicles/public';
import type { Vehicle } from '@/types';

/** Règles de visibilité publique (identiques à GET /api/vehicles/[ref]) */
export function isPubliclyVisible(vehicle: Vehicle): boolean {
  const record = vehicle as Vehicle & { archived_at?: string | null };
  const agency = vehicle.agency as (Vehicle['agency'] & { archived_at?: string | null }) | undefined;
  return Boolean(vehicle.published && !record.archived_at && agency?.status === 'ACTIVE' && !agency?.archived_at);
}

/**
 * Véhicule public par slug, mis en cache pour la durée de la requête (métadonnées + page = une seule lecture).
 * Une erreur d'accès à la base est propagée (page d'erreur), jamais transformée en « introuvable ».
 */
export const getPublicVehicleBySlug = cache(async (slug: string): Promise<Vehicle | null> => {
  const vehicle = await vehiclesService.getVehicleBySlug(decodeURIComponent(slug));
  return vehicle && isPubliclyVisible(vehicle) ? toPublicVehicle(vehicle) : null;
});

/** Alternatives du même modèle (ou même catégorie et boîte), au plus `limit`, en projection publique */
export async function getPublicAlternatives(vehicle: Vehicle, limit = 6): Promise<Vehicle[]> {
  try {
    const catalog = await vehiclesService.getVehicles();
    return toPublicVehicles(
      findSameModelAlternatives({ currentVehicle: vehicle, allVehicles: catalog, allBookings: [] }).slice(0, limit)
    );
  } catch (error) {
    console.error('[PublicQueries] Alternatives indisponibles :', error instanceof Error ? error.message : error);
    return [];
  }
}
