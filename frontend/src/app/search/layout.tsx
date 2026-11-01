import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Recherche & Comparateur de Voitures à Nador | CarDrive',
  description:
    'Comparez les prix et disponibilités des voitures de location à Nador, Aéroport Nador Al-Aroui et Port Beni Ansar. Réservation sans paiement immédiat.',
  alternates: { canonical: '/search' },
  openGraph: {
    title: 'Rechercher une voiture de location à Nador — CarDrive',
    description:
      'Comparez instantanément les véhicules disponibles auprès des agences partenaires vérifiées à Nador.',
    url: 'https://cardrive.ma/search',
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
