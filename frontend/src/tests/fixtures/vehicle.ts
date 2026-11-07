import type { Vehicle } from '@/types';

/**
 * Véhicule de test (tests de composants uniquement — jamais importé par le code applicatif).
 * Identifiants au format UUID, comme en base.
 */
export function testVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    agency_id: '22222222-2222-4222-8222-222222222222',
    unit_number: '',
    license_plate: '',
    brand: 'Dacia',
    model: 'Sandero',
    slug: 'dacia-sandero-2024',
    year: 2024,
    category: 'ECONOMY',
    transmission: 'MANUAL',
    fuel: 'DIESEL',
    seats: 5,
    doors: 5,
    air_conditioning: true,
    mileage: 12000,
    daily_price: 300,
    deposit: 3000,
    min_rental_days: 1,
    status: 'AVAILABLE',
    published: true,
    featured: false,
    images: [],
    features: [],
    created_at: '2026-01-01T00:00:00.000Z',
    agency: {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Agence Test',
    },
    ...overrides,
  } as Vehicle;
}
