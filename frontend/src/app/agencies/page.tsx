import type { Metadata } from 'next';
import { AgenciesClient } from './AgenciesClient';

export const metadata: Metadata = {
  title: 'Agences de location de voitures à Nador | CarDrive',
  description:
    'Découvrez les agences partenaires vérifiées sur CarDrive à Nador, l’aéroport Nador-Al Aroui et Beni Ansar. Consultez leurs parcs, conditions et tarifs.',
  alternates: { canonical: '/agencies' },
  openGraph: {
    title: 'Agences partenaires vérifiées à Nador — CarDrive',
    description:
      'Comparez les agences locales de location à Nador. Véhicules contrôlés, tarifs transparents et support dédié.',
    url: 'https://cardrive.ma/agencies',
  },
};

export default function AgenciesPage() {
  return <AgenciesClient />;
}
