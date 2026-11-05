import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalogFacets, sortByRelevance } from '../lib/catalog/discovery';
import type { Vehicle } from '../types';

const vehicle = (id: string, patch: Partial<Vehicle>): Vehicle =>
  ({
    id,
    slug: id,
    brand: 'Marque',
    model: id,
    year: 2025,
    category: 'Économique',
    transmission: 'MANUAL',
    fuel: 'DIESEL',
    daily_price: 300,
    status: 'AVAILABLE',
    images: ['a.jpg'],
    agency_id: 'agence',
    ...patch,
  }) as Vehicle;

test('Filtres — seules les catégories réellement présentes sont proposées, avec leur nombre', () => {
  const facets = catalogFacets([
    vehicle('a', { category: 'SUV' }),
    vehicle('b', { category: 'SUV' }),
    vehicle('c', { category: 'Luxe', transmission: 'AUTOMATIC' }),
  ]);
  assert.deepEqual(facets.categories, [
    { value: 'SUV', count: 2 },
    { value: 'Luxe', count: 1 },
  ]);
  assert.equal(facets.categories.some((facet) => facet.value === 'Berline'), false);
  assert.deepEqual(
    facets.transmissions.map((facet) => facet.value).sort(),
    ['AUTOMATIC', 'MANUAL']
  );
});

test('Recommandation — un véhicule loué n’est jamais classé avant un véhicule disponible', () => {
  const sorted = sortByRelevance(
    [
      vehicle('loue-pas-cher', { status: 'RENTED', daily_price: 150 }),
      vehicle('dispo-cher', { status: 'AVAILABLE', daily_price: 600 }),
    ],
    { periodChecked: false }
  );
  assert.deepEqual(sorted.map((v) => v.id), ['dispo-cher', 'loue-pas-cher']);
});

test('Recommandation — à disponibilité égale, meilleur prix de sa catégorie d’abord ; ordre stable', () => {
  const list = [
    vehicle('cher', { daily_price: 400 }),
    vehicle('moyen', { daily_price: 300 }),
    vehicle('bon-prix', { daily_price: 200 }),
  ];
  const first = sortByRelevance(list, { periodChecked: false }).map((v) => v.id);
  assert.deepEqual(first, ['bon-prix', 'moyen', 'cher']);
  assert.deepEqual(sortByRelevance([...list].reverse(), { periodChecked: false }).map((v) => v.id), first);
});
