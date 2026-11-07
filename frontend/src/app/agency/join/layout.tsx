import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Devenir Agence Partenaire KlickDrive | Location de Voitures Nador',
  description:
    'Rejoignez le réseau des agences de location partenaires à Nador. Espace de gestion de flotte, visibilité locale et réception de demandes qualifiées.',
  alternates: { canonical: '/agency/join' },
  openGraph: {
    title: 'Rejoindre KlickDrive — Pour les agences de location à Nador',
    description:
      'Présentez votre flotte sur KlickDrive et recevez des demandes de réservation directes et sécurisées.',
    url: 'https://klickdrive.ma/agency/join',
  },
};

export default function AgencyJoinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
