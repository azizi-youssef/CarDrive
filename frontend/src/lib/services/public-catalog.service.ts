import { agenciesService } from '@/lib/services/agencies.service';
import { vehiclesService } from '@/lib/services/vehicles.service';
import type { Agency, Vehicle } from '@/types';

/**
 * Données publiques du catalogue pour le rendu serveur : mêmes services et même forme
 * que GET /api/vehicles et GET /api/agencies (agences actives, nombre de véhicules).
 * Renvoie null en cas d'échec : la page retombe alors sur le chargement côté navigateur.
 */
export async function getPublicCatalog(): Promise<{ vehicles: Vehicle[]; agencies: Agency[] } | null> {
  try {
    const [agencies, vehicles] = await Promise.all([agenciesService.getAgencies(true), vehiclesService.getVehicles()]);
    const withCounts = agencies.map((agency) => ({
      ...agency,
      vehicle_count: agency.vehicle_count ?? vehicles.filter((vehicle) => vehicle.agency_id === agency.id).length,
    }));
    // Sérialisation explicite : seules des données JSON passent au composant client
    return JSON.parse(JSON.stringify({ vehicles, agencies: withCounts }));
  } catch (error) {
    console.error('[PublicCatalog] Préchargement impossible :', error instanceof Error ? error.message : error);
    return null;
  }
}
