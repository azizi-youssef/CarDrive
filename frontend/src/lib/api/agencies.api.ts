import { apiFetch } from './client';
import type { Agency } from '@/types';

/**
 * Récupère toutes les agences actives
 */
export async function getAgencies(onlyActive = true) {
  return apiFetch<Agency[]>(`/api/agencies?onlyActive=${onlyActive}`);
}

/**
 * Récupère une agence par slug (avec vehicleCount)
 */
export async function getAgencyBySlug(slug: string) {
  return apiFetch<Agency & { vehicleCount: number }>(`/api/agencies/${slug}`);
}

/**
 * Récupère les véhicules d'une agence par son slug
 */
export async function getAgencyVehicles(slug: string) {
  return apiFetch(`/api/agencies/${slug}/vehicles`);
}

/**
 * Met à jour le statut d'une agence (admin uniquement)
 */
export async function updateAgencyStatus(id: string, status: string, verified: boolean) {
  return apiFetch<Agency>(`/api/agencies/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, verified }),
  });
}
