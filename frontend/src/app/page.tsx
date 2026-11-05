import { HomeClient } from './HomeClient';
import { getPublicCatalog } from '@/lib/services/public-catalog.service';

// Rendu à la requête : jamais de données figées au build (ni données de démonstration sans Supabase)
export const dynamic = 'force-dynamic';

/**
 * Accueil : véhicules et agences préchargés côté serveur (contenu visible dès le HTML,
 * sans attendre les appels /api côté navigateur). L'interactivité reste dans HomeClient.
 */
export default async function HomePage() {
  const catalog = await getPublicCatalog();
  return <HomeClient initialVehicles={catalog?.vehicles ?? null} initialAgencies={catalog?.agencies ?? null} />;
}
