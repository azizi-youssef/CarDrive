import { notFound } from 'next/navigation';
import { CarDetailsClient } from './CarDetailsClient';
import { getPublicAlternatives, getPublicVehicleBySlug } from '@/lib/vehicles/public-queries';
import { breadcrumbJsonLd, jsonLdScript, SITE_URL } from '@/lib/seo/structured-data';
import { isMotorcycle } from '@/lib/vehicles/kind';
import type { Vehicle } from '@/types';

// Rendu à la requête : prix et statut proviennent de la base au moment de la visite
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

const FUEL_SCHEMA: Record<string, string> = { DIESEL: 'Diesel', GASOLINE: 'Gasoline', HYBRID: 'Hybrid', ELECTRIC: 'Electric' };

/** Données structurées du véhicule : faits enregistrés uniquement (pas de note, pas de disponibilité affirmée) */
function vehicleJsonLd(vehicle: Vehicle) {
  const moto = isMotorcycle(vehicle);
  const url = `${SITE_URL}/cars/${vehicle.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': moto ? 'Motorcycle' : 'Car',
    '@id': `${url}#vehicle`,
    name: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
    url,
    brand: { '@type': 'Brand', name: vehicle.brand },
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
    ...(vehicle.images?.length ? { image: vehicle.images.slice(0, 5) } : {}),
    ...(FUEL_SCHEMA[vehicle.fuel] ? { fuelType: FUEL_SCHEMA[vehicle.fuel] } : {}),
    vehicleTransmission: vehicle.transmission === 'AUTOMATIC' ? 'Automatic' : 'Manual',
    ...(vehicle.seats > 0 ? { seatingCapacity: vehicle.seats } : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'MAD',
      price: vehicle.daily_price,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: vehicle.daily_price,
        priceCurrency: 'MAD',
        unitCode: 'DAY',
        referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'DAY' },
      },
      ...(vehicle.agency ? { seller: { '@type': 'AutoRental', name: vehicle.agency.name, url: `${SITE_URL}/agencies/${vehicle.agency.slug}` } } : {}),
    },
  };
}

/**
 * Fiche véhicule rendue côté serveur : contenu, métadonnées et données structurées présents dans le HTML.
 * L'interactivité (galerie, disponibilité par dates, demande de réservation) reste dans CarDetailsClient.
 */
export default async function CarDetailsPage({ params }: Props) {
  const { slug } = await params;
  const vehicle = await getPublicVehicleBySlug(slug);
  if (!vehicle) notFound();

  const alternativesPool = await getPublicAlternatives(vehicle);
  const moto = isMotorcycle(vehicle);
  const structured = [
    vehicleJsonLd(vehicle),
    breadcrumbJsonLd([
      { name: 'Accueil', path: '/' },
      { name: moto ? 'Motos' : 'Voitures', path: moto ? '/motos' : '/search' },
      { name: `${vehicle.brand} ${vehicle.model}`, path: `/cars/${vehicle.slug}` },
    ]),
  ];

  return (
    <>
      <CarDetailsClient slug={vehicle.slug} initialVehicle={vehicle} alternativesPool={alternativesPool} />
      {structured.map((data, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />
      ))}
    </>
  );
}
