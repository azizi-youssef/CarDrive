import assert from 'node:assert/strict';
import type { Vehicle } from '@/types';
import { isVehicleAvailable } from '@/lib/availability/engine';

const vehicle: Vehicle = {
  id: 'peugeot-test',
  agency_id: 'agency-test',
  unit_number: 'Peugeot 208',
  license_plate: 'TEST-208',
  brand: 'Peugeot',
  model: '208',
  slug: 'peugeot-208-test',
  year: 2024,
  category: 'Citadine',
  transmission: 'MANUAL',
  fuel: 'GASOLINE',
  seats: 5,
  doors: 5,
  air_conditioning: true,
  mileage: 1000,
  daily_price: 300,
  deposit: 1000,
  min_rental_days: 1,
  status: 'AVAILABLE',
  published: true,
  featured: false,
  images: [],
  features: [],
  created_at: '2026-01-01T00:00:00Z',
};

const dateRange = { startDate: '2026-10-12', endDate: '2026-10-15' };

assert.equal(
  isVehicleAvailable(vehicle, [{
    vehicle_id: vehicle.id,
    start_date: '2026-10-13',
    end_date: '2026-10-14',
    status: 'CONFIRMED',
  }], dateRange.startDate, dateRange.endDate),
  false,
  'a confirmed overlapping reservation hides the vehicle from public search'
);

assert.equal(
  isVehicleAvailable(vehicle, [{
    vehicle_id: vehicle.id,
    start_date: '2026-10-13',
    end_date: '2026-10-14',
    status: 'ALTERNATIVE_PROPOSED',
  }], dateRange.startDate, dateRange.endDate),
  true,
  'a pending alternative proposal does not hold a vehicle without an expiry policy'
);

assert.equal(
  isVehicleAvailable(vehicle, [{
    vehicle_id: vehicle.id,
    start_date: '2026-10-13',
    end_date: '2026-10-14',
    status: 'PENDING',
  }], dateRange.startDate, dateRange.endDate),
  true,
  'a pending customer request does not hold a vehicle without an expiry policy'
);

assert.equal(
  isVehicleAvailable(vehicle, [{
    vehicle_id: vehicle.id,
    start_date: '2026-10-16',
    end_date: '2026-10-18',
    status: 'CONFIRMED',
  }], dateRange.startDate, dateRange.endDate),
  true,
  'a reservation outside the requested period does not hide the vehicle'
);

assert.equal(
  isVehicleAvailable({ ...vehicle, status: 'BLOCKED' }, [], dateRange.startDate, dateRange.endDate),
  false,
  'manually blocked vehicles are never shown as available'
);

assert.equal(
  isVehicleAvailable({ ...vehicle, status: 'RENTED' }, [{
    vehicle_id: vehicle.id,
    start_date: '2026-10-01',
    end_date: '2026-10-05',
    status: 'ACTIVE',
  }], dateRange.startDate, dateRange.endDate),
  true,
  'a currently rented vehicle can be available for a later non-overlapping period'
);

console.log('Availability tests passed (6 assertions).');
