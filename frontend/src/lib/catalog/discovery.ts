import type { Vehicle } from '@/types';
import { vehicleTypeOf } from '@/lib/vehicles/kind';

/**
 * Découverte du catalogue : options de filtres issues des véhicules réels et recommandation
 * déterministe, explicable, sans dépendance externe. Aucune donnée n'est inventée :
 * une catégorie sans véhicule n'est pas proposée.
 */

export interface Facet<T extends string = string> {
  value: T;
  count: number;
}

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function countBy<T extends string>(values: (T | null | undefined)[]): Facet<T>[] {
  const counts = new Map<T, number>();
  for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].map(([value, count]) => ({ value, count }));
}

/** Types (voitures / motos), catégories, boîtes et carburants réellement présents, avec leur nombre de véhicules. */
export function catalogFacets(vehicles: Vehicle[]) {
  return {
    types: countBy(vehicles.map((vehicle) => vehicleTypeOf(vehicle) as string)),
    categories: countBy(vehicles.map((vehicle) => vehicle.category as string)).sort(
      (a, b) => b.count - a.count || a.value.localeCompare(b.value, 'fr')
    ),
    transmissions: countBy(vehicles.map((vehicle) => vehicle.transmission as string)),
    fuels: countBy(vehicles.map((vehicle) => vehicle.fuel as string)),
  };
}

export function sameCategory(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}

/* ── Recommandation ─────────────────────────────────────────────────── */

export interface RelevanceContext {
  /** Disponibilité vérifiée pour des dates précises (l'API ne renvoie alors que les véhicules libres) */
  periodChecked: boolean;
  /** Budget maximum par jour, si l'utilisateur en a fixé un */
  maxPrice?: number;
}

/**
 * Score de pertinence (plus haut = mieux), règles publiques et stables :
 * 1. disponible d'abord (statut actuel, ou vérifié pour les dates) ;
 * 2. dans le budget fixé : plus proche du budget = plus pertinent (meilleur équipement pour le prix) ;
 *    sans budget : meilleur rapport prix / moyenne de sa catégorie ;
 * 3. modèle plus récent ;
 * 4. au moins deux photos (fiche plus complète).
 */
export function relevanceScore(vehicle: Vehicle, categoryAverage: number, context: RelevanceContext): number {
  const available = context.periodChecked || vehicle.status === 'AVAILABLE';
  let score = available ? 1000 : 0;

  if (context.maxPrice && vehicle.daily_price <= context.maxPrice) {
    score += 200 * (vehicle.daily_price / context.maxPrice);
  } else if (categoryAverage > 0) {
    // Jusqu'à +200 pour un prix sous la moyenne de la catégorie, négatif au-dessus
    score += Math.max(-200, Math.min(200, 200 * ((categoryAverage - vehicle.daily_price) / categoryAverage)));
  }

  const year = Number(vehicle.year) || 0;
  score += Math.max(0, Math.min(5, year - 2021)) * 20;
  if ((vehicle.images?.length ?? 0) >= 2) score += 15;
  return score;
}

/** Trie par pertinence ; égalités départagées par prix croissant puis nom (ordre stable). */
export function sortByRelevance(vehicles: Vehicle[], context: RelevanceContext): Vehicle[] {
  const totals = new Map<string, { sum: number; n: number }>();
  for (const vehicle of vehicles) {
    const key = normalize(vehicle.category || '');
    const entry = totals.get(key) ?? { sum: 0, n: 0 };
    entry.sum += vehicle.daily_price;
    entry.n += 1;
    totals.set(key, entry);
  }
  const average = (vehicle: Vehicle) => {
    const entry = totals.get(normalize(vehicle.category || ''));
    return entry ? entry.sum / entry.n : 0;
  };
  return [...vehicles].sort(
    (a, b) =>
      relevanceScore(b, average(b), context) - relevanceScore(a, average(a), context) ||
      a.daily_price - b.daily_price ||
      `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`, 'fr')
  );
}

export const RELEVANCE_EXPLANATION =
  'Disponibles d’abord, puis meilleur rapport prix / catégorie (ou plus proche de votre budget), modèles récents et fiches les plus complètes.';
