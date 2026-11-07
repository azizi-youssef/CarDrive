import { describe, expect, it } from 'vitest';
import { availabilityMessage, evaluateAvailability, isUuid, rangesOverlap, type AvailabilityFacts } from './status';

const period = { startDate: '2026-12-10', endDate: '2026-12-14' };
const today = '2026-11-07';

const facts = (overrides: Partial<AvailabilityFacts> = {}): AvailabilityFacts => ({
  vehicle: { status: 'AVAILABLE', published: true, archived_at: null },
  agency: { status: 'ACTIVE', archived_at: null },
  bookings: [],
  unavailability: [],
  ...overrides,
});

describe('evaluateAvailability (mêmes règles que la fonction SQL vehicle_availability)', () => {
  it('disponible sans conflit', () => {
    expect(evaluateAvailability(facts(), period, today)).toBe('AVAILABLE');
  });

  it('un véhicule loué aujourd’hui reste réservable pour une période future', () => {
    expect(evaluateAvailability(facts({ vehicle: { status: 'RENTED', published: true, archived_at: null } }), period, today)).toBe('AVAILABLE');
  });

  it.each([
    ['véhicule absent', { vehicle: null }],
    ['agence absente', { agency: null }],
    ['véhicule non publié', { vehicle: { status: 'AVAILABLE', published: false, archived_at: null } }],
    ['véhicule archivé', { vehicle: { status: 'AVAILABLE', published: true, archived_at: '2026-01-01' } }],
    ['véhicule en maintenance', { vehicle: { status: 'MAINTENANCE', published: true, archived_at: null } }],
    ['véhicule bloqué', { vehicle: { status: 'BLOCKED', published: true, archived_at: null } }],
    ['agence suspendue', { agency: { status: 'SUSPENDED', archived_at: null } }],
    ['agence archivée', { agency: { status: 'ACTIVE', archived_at: '2026-01-01' } }],
  ])('indisponible : %s', (_label, override) => {
    expect(evaluateAvailability(facts(override as Partial<AvailabilityFacts>), period, today)).toBe('UNAVAILABLE');
  });

  it('une réservation confirmée qui chevauche bloque (bornes incluses)', () => {
    const bookings = [{ start_date: '2026-12-14', end_date: '2026-12-16', status: 'APPROVED' }];
    expect(evaluateAvailability(facts({ bookings }), period, today)).toBe('UNAVAILABLE');
  });

  it('une simple demande (REQUESTED) ou une réservation annulée ne bloque pas', () => {
    const bookings = [
      { start_date: '2026-12-10', end_date: '2026-12-14', status: 'REQUESTED' },
      { start_date: '2026-12-10', end_date: '2026-12-14', status: 'CANCELLED' },
    ];
    expect(evaluateAvailability(facts({ bookings }), period, today)).toBe('AVAILABLE');
  });

  it('une réservation confirmée déjà terminée ne bloque plus', () => {
    const bookings = [{ start_date: '2026-11-01', end_date: '2026-11-05', status: 'ACTIVE' }];
    expect(evaluateAvailability(facts({ bookings }), { startDate: '2026-11-03', endDate: '2026-11-04' }, today)).toBe('AVAILABLE');
  });

  it('un blocage manuel de l’agence sur la période bloque', () => {
    expect(evaluateAvailability(facts({ unavailability: [{ start_date: '2026-12-12', end_date: '2026-12-12' }] }), period, today)).toBe('UNAVAILABLE');
  });
});

describe('utilitaires de disponibilité', () => {
  it('rangesOverlap gère les bornes incluses', () => {
    expect(rangesOverlap({ start_date: '2026-01-01', end_date: '2026-01-05' }, { start_date: '2026-01-05', end_date: '2026-01-07' })).toBe(true);
    expect(rangesOverlap({ start_date: '2026-01-01', end_date: '2026-01-04' }, { start_date: '2026-01-05', end_date: '2026-01-07' })).toBe(false);
  });

  it('isUuid refuse tout identifiant non UUID', () => {
    expect(isUuid('20000000-0000-4000-8000-00000000000a')).toBe(true);
    expect(isUuid('dacia-logan')).toBe(false);
    expect(isUuid("1' OR '1'='1")).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });

  it('un état inconnu n’est jamais présenté comme disponible', () => {
    expect(availabilityMessage('UNKNOWN')).not.toMatch(/^Disponible/);
    expect(availabilityMessage('UNKNOWN')).toMatch(/impossible à vérifier/);
  });
});
