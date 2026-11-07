/**
 * Disponibilité d'un véhicule sur une période : trois états explicites.
 *
 * - AVAILABLE   : vérifiée, aucune réservation confirmée ni blocage sur la période ;
 * - UNAVAILABLE : vérifiée, conflit (réservation confirmée, blocage agence, véhicule ou agence inactifs) ;
 * - UNKNOWN     : impossible à vérifier (base ou fonction indisponible). Ce n'est JAMAIS une disponibilité :
 *                 l'interface l'affiche comme « non vérifiée » et aucune demande n'est acceptée sur cette base.
 *
 * Les règles reproduisent exactement la fonction SQL public.vehicle_availability()
 * (migration 20261103000100_vehicle_availability_volatile.sql), utilisée en priorité.
 */

export type AvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN';

/** Statuts de réservation qui bloquent le véhicule (identiques à la fonction SQL et à la contrainte d'exclusion) */
export const BLOCKING_BOOKING_STATUSES = ['APPROVED', 'CONFIRMED', 'ACTIVE', 'READY_FOR_PICKUP'] as const;

/** Statuts de flotte compatibles avec une location future */
const RENTABLE_VEHICLE_STATUSES = new Set(['AVAILABLE', 'RENTED']);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

/** Identifiant de véhicule invalide : erreur de validation (400), jamais une disponibilité */
export class AvailabilityValidationError extends Error {
  constructor(message = 'Identifiant de véhicule invalide.') {
    super(message);
    this.name = 'AvailabilityValidationError';
  }
}

type DateRange = { start_date: string; end_date: string };

/** Chevauchement de deux périodes AAAA-MM-JJ, bornes incluses (daterange '[]' en SQL) */
export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.start_date <= b.end_date && b.start_date <= a.end_date;
}

export interface AvailabilityFacts {
  vehicle: { status: string; published: boolean; archived_at: string | null } | null;
  agency: { status: string; archived_at: string | null } | null;
  /** Réservations du véhicule (tous statuts) chargées pour la période */
  bookings: Array<DateRange & { status: string }>;
  /** Blocages manuels / maintenance déclarés par l'agence */
  unavailability: DateRange[];
}

/**
 * Évalue la disponibilité à partir de faits déjà chargés (fonction pure, testée).
 * Utilisée seulement quand la fonction SQL est indisponible ; même résultat attendu.
 */
export function evaluateAvailability(
  facts: AvailabilityFacts,
  period: { startDate: string; endDate: string },
  today: string
): Exclude<AvailabilityStatus, 'UNKNOWN'> {
  const { vehicle, agency } = facts;
  if (!vehicle || !agency) return 'UNAVAILABLE';
  if (!vehicle.published || vehicle.archived_at) return 'UNAVAILABLE';
  if (agency.status !== 'ACTIVE' || agency.archived_at) return 'UNAVAILABLE';
  if (!RENTABLE_VEHICLE_STATUSES.has(String(vehicle.status))) return 'UNAVAILABLE';

  const requested = { start_date: period.startDate, end_date: period.endDate };
  const blocking = new Set<string>(BLOCKING_BOOKING_STATUSES);
  const bookingConflict = facts.bookings.some(
    (booking) => blocking.has(booking.status) && booking.end_date >= today && rangesOverlap(booking, requested)
  );
  if (bookingConflict) return 'UNAVAILABLE';

  if (facts.unavailability.some((block) => rangesOverlap(block, requested))) return 'UNAVAILABLE';
  return 'AVAILABLE';
}

/** Message affiché au client selon l'état (aucune promesse en cas d'état inconnu) */
export function availabilityMessage(status: AvailabilityStatus): string {
  switch (status) {
    case 'AVAILABLE':
      return 'Disponible pour ces dates.';
    case 'UNAVAILABLE':
      return 'Indisponible pour ces dates.';
    default:
      return 'Disponibilité impossible à vérifier pour le moment. Réessayez dans quelques instants.';
  }
}
