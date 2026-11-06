import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import {
  CATALOG_PATHS,
  categoryMatchesType,
  typeOfCategory,
  formatEngineCc,
  isMotorcycle,
  motorcycleLicenseLabel,
  parseVehicleTypeParam,
  vehicleTypeOf,
} from '../lib/vehicles/kind';
import {
  normalizeVehicleKindFields,
  onlyProvidedFields,
  vehicleCreateSchema,
  vehicleKindIssues,
  vehicleUpdateSchema,
} from '../lib/validations/vehicle';
import { isMotorcycleSchemaMissing } from '../lib/vehicles/schema-support';
import { catalogFacets } from '../lib/catalog/discovery';
import { pdfService } from '../lib/services/pdf.service';
import type { Booking, Vehicle } from '../types';

const scooter = {
  vehicle_type: 'MOTORCYCLE',
  brand: 'Yamaha',
  model: 'NMAX 125',
  year: 2025,
  category: 'Scooter',
  transmission: 'AUTOMATIC',
  fuel: 'GASOLINE',
  seats: 2,
  engine_cc: 125,
  license_required: 'A1',
  daily_price: 180,
  deposit: 2000,
};

test('Type de véhicule : colonne prioritaire, sinon déduit de la catégorie', () => {
  assert.equal(vehicleTypeOf({ vehicle_type: 'MOTORCYCLE', category: 'Scooter' }), 'MOTORCYCLE');
  assert.equal(vehicleTypeOf({ category: 'Roadster' }), 'MOTORCYCLE', 'base non migrée : déduction par catégorie');
  assert.equal(vehicleTypeOf({ category: 'SUV' }), 'CAR');
  assert.equal(vehicleTypeOf(null), 'CAR');
  assert.equal(isMotorcycle({ vehicle_type: 'CAR', category: 'SUV' }), false);
  assert.equal(categoryMatchesType('Trail', 'MOTORCYCLE'), true);
  assert.equal(categoryMatchesType('Trail', 'CAR'), false);
  assert.equal(parseVehicleTypeParam('moto'), 'MOTORCYCLE');
  assert.equal(parseVehicleTypeParam('CAR'), 'CAR');
  assert.equal(parseVehicleTypeParam('avion'), null);
  assert.equal(formatEngineCc(125), '125 cm³');
  assert.equal(formatEngineCc(null), '');
  assert.equal(motorcycleLicenseLabel('A2'), 'Permis A2');
  assert.equal(motorcycleLicenseLabel('Z'), '');
});

test('Catalogues séparés : chaque catégorie mène à son catalogue', () => {
  assert.equal(CATALOG_PATHS.CAR, '/search');
  assert.equal(CATALOG_PATHS.MOTORCYCLE, '/motos');
  assert.equal(typeOfCategory('Scooter'), 'MOTORCYCLE', '/search?category=Scooter est redirigé vers /motos');
  assert.equal(typeOfCategory('Berline'), 'CAR', '/motos?category=Berline est redirigé vers /search');
  assert.equal(typeOfCategory('Tous les types'), null, 'pas de redirection sans catégorie précise');
  assert.equal(typeOfCategory(''), null);
});

test('Validation : une moto valide est acceptée, les incohérences sont refusées', () => {
  const ok = vehicleCreateSchema.safeParse(scooter);
  assert.equal(ok.success, true, JSON.stringify(!ok.success && ok.error.issues));

  const carCategory = vehicleCreateSchema.safeParse({ ...scooter, category: 'SUV' });
  assert.equal(carCategory.success, false, 'catégorie voiture pour une moto');

  const threeSeats = vehicleCreateSchema.safeParse({ ...scooter, seats: 3 });
  assert.equal(threeSeats.success, false, 'une moto a 1 ou 2 places');

  const badLicense = vehicleCreateSchema.safeParse({ ...scooter, license_required: 'C' });
  assert.equal(badLicense.success, false);

  const carWithCc = vehicleCreateSchema.safeParse({
    brand: 'Dacia', model: 'Logan', year: 2025, category: 'Économique', transmission: 'MANUAL',
    fuel: 'DIESEL', daily_price: 300, engine_cc: 1500,
  });
  assert.equal(carWithCc.success, false, 'la cylindrée ne concerne que les motos');

  const plainCar = vehicleCreateSchema.safeParse({
    brand: 'Dacia', model: 'Logan', year: 2025, category: 'Économique', transmission: 'MANUAL', fuel: 'DIESEL', daily_price: 300,
  });
  assert.equal(plainCar.success, true);
  assert.equal(plainCar.success && plainCar.data.vehicle_type, 'CAR', 'voiture par défaut');
});

test('Normalisation : moto sans portes ni clim, voiture sans champs moto', () => {
  const moto = normalizeVehicleKindFields({ vehicle_type: 'MOTORCYCLE' as const, doors: 5, air_conditioning: true, engine_cc: 300 });
  assert.equal(moto.doors, 0);
  assert.equal(moto.air_conditioning, false);
  assert.equal(moto.engine_cc, 300);
  const car = normalizeVehicleKindFields({ vehicle_type: 'CAR' as const, engine_cc: 300, license_required: 'A' });
  assert.equal(car.engine_cc, null);
  assert.equal(car.license_required, null);
  assert.deepEqual(vehicleKindIssues({ vehicle_type: 'MOTORCYCLE', category: 'Custom', seats: 1 }), []);
});

test('Mise à jour partielle : une dépublication ne touche ni photos ni équipements', () => {
  const body = { published: false };
  const parsed = vehicleUpdateSchema.parse(body);
  // Zod remplit les valeurs par défaut (images: [], seats: 5…) même en mode partiel
  assert.deepEqual(parsed.images, []);
  const input = onlyProvidedFields(parsed, body);
  assert.deepEqual(Object.keys(input), ['published']);
  assert.equal(input.images, undefined);
  assert.equal(input.vehicle_type, undefined, 'le type n\'est jamais remis à « voiture » par défaut');
});

test('Base non migrée : erreurs reconnues pour un message clair', () => {
  assert.equal(isMotorcycleSchemaMissing({ code: 'PGRST204', message: "Could not find the 'vehicle_type' column" }), true);
  assert.equal(isMotorcycleSchemaMissing({ code: '42703', message: 'column "engine_cc" does not exist' }), true);
  assert.equal(isMotorcycleSchemaMissing({ code: '23514', message: 'violates check constraint "vehicles_category_check"' }), true);
  assert.equal(isMotorcycleSchemaMissing({ code: '23505', message: 'duplicate key' }), false);
  assert.equal(isMotorcycleSchemaMissing(null), false);
});

test('Catalogue : facettes voitures / motos issues des véhicules réels', () => {
  const vehicles = [
    { id: '1', category: 'SUV', transmission: 'MANUAL', fuel: 'DIESEL' },
    { id: '2', category: 'Scooter', vehicle_type: 'MOTORCYCLE', transmission: 'AUTOMATIC', fuel: 'GASOLINE' },
    { id: '3', category: 'Roadster', transmission: 'MANUAL', fuel: 'GASOLINE' },
  ] as unknown as Vehicle[];
  const facets = catalogFacets(vehicles);
  assert.deepEqual(
    [...facets.types].sort((a, b) => a.value.localeCompare(b.value)),
    [
      { value: 'CAR', count: 1 },
      { value: 'MOTORCYCLE', count: 2 },
    ]
  );
  // Sans moto, aucune facette « moto » n'est créée (le filtre reste masqué)
  assert.deepEqual(catalogFacets([vehicles[0]]).types, [{ value: 'CAR', count: 1 }]);
});

function pdfText(bytes: Uint8Array): string {
  const raw = Buffer.from(bytes).toString('latin1');
  const chunks: string[] = [];
  const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;
  while ((match = streamRe.exec(raw))) {
    try {
      chunks.push(inflateSync(Buffer.from(match[1], 'latin1')).toString('latin1'));
    } catch {
      chunks.push(match[1]);
    }
  }
  return (
    chunks
      .join('\n')
      .match(/\((?:\\.|[^\\)])*\)\s*Tj/g)
      ?.map((op) => op.replace(/\)\s*Tj$/, '').slice(1).replace(/\\(.)/g, '$1'))
      .join(' ') ?? ''
  );
}

test('PDF : une réservation de moto affiche cylindrée et permis exigé, sur une page', () => {
  const booking = {
    id: 'b1',
    reference: 'CD-2026-654321',
    vehicle_id: 'v1',
    agency_id: 'a1',
    customer_name: 'Karim B.',
    customer_email: 'karim@example.com',
    customer_phone: '+212 6 00 00 00 00',
    start_date: '2026-11-10',
    end_date: '2026-11-12',
    pickup_time: '10:00',
    dropoff_time: '18:00',
    pickup_location: 'Nador Centre',
    dropoff_location: 'Nador Centre',
    total_days: 2,
    daily_price: 180,
    total_price: 360,
    commission_rate: 15,
    commission_amount: 54,
    agency_amount: 306,
    deposit_amount: 2000,
    status: 'REQUESTED',
    created_at: '2026-11-06T10:00:00Z',
    vehicle: { ...scooter, id: 'v1' },
    agency: { name: 'Agence test', phone: '', email: '', address: '', city: 'Nador' },
  } as unknown as Booking;
  const bytes = pdfService.generateBookingRequestPdf(booking);
  const text = pdfText(bytes);
  assert.ok(text.includes('Moto · Scooter'), text.slice(0, 400));
  assert.ok(text.includes('125 cm³'));
  assert.ok(text.includes('Permis A1'));
  assert.ok(text.includes('MOTO ET AGENCE PARTENAIRE'));
  assert.ok(!/Siège enfant/i.test(text));
  assert.ok(text.includes('Page 1 / 1'));
});
