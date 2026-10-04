import { apiFetch } from './client';
import type { Vehicle, SearchFilters } from '@/types';

export interface VehiclesResponse {
  data: Vehicle[];
  meta: { total: number; limit: number; offset: number };
}

/**
 * Récupère la liste des véhicules avec filtres optionnels
 */
export async function getVehicles(filters?: Partial<SearchFilters> & { limit?: number; offset?: number }) {
  const params = new URLSearchParams();
  if (filters?.category && filters.category !== 'Tous les types') params.set('category', filters.category);
  if (filters?.brand) params.set('brand', filters.brand);
  if (filters?.transmission) params.set('transmission', filters.transmission);
  if (filters?.fuel) params.set('fuel', filters.fuel);
  if (filters?.minPrice) params.set('minPrice', String(filters.minPrice));
  if (filters?.maxPrice) params.set('maxPrice', String(filters.maxPrice));
  if (filters?.agencyId) params.set('agencyId', filters.agencyId);
  if (filters?.query) params.set('query', filters.query);
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate) params.set('endDate', filters.endDate);
  if (filters?.sortBy) params.set('sortBy', filters.sortBy);
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.offset) params.set('offset', String(filters.offset));

  const query = params.toString();
  return apiFetch<Vehicle[]>(`/api/vehicles${query ? `?${query}` : ''}`);
}

/**
 * Récupère un véhicule par slug
 */
export async function getVehicleBySlug(slug: string) {
  return apiFetch<Vehicle>(`/api/vehicles/${slug}`);
}

/**
 * Met à jour un véhicule
 */
export async function updateVehicle(id: string, updates: Partial<Vehicle>) {
  return apiFetch<Vehicle>(`/api/vehicles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/**
 * Supprime un véhicule
 */
export async function deleteVehicle(id: string) {
  return apiFetch<{ message: string }>(`/api/vehicles/${id}`, { method: 'DELETE' });
}
