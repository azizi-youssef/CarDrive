import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Recherche & Comparateur de Voitures à Nador | KlickDrive',
  description:
    'Comparez les prix et disponibilités des voitures de location à Nador, Aéroport Nador Al-Aroui et Port Beni Ansar. Réservation sans paiement immédiat.',
  alternates: { canonical: '/search' },
  openGraph: {
    title: 'Rechercher une voiture de location à Nador — KlickDrive',
    description:
      'Comparez instantanément les véhicules disponibles auprès des agences partenaires vérifiées à Nador.',
    url: 'https://klickdrive.ma/search',
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
