import type { Metadata } from 'next';
import React from 'react';
import { FaqClient } from './FaqClient';

export const metadata: Metadata = {
  title: 'Questions fréquentes sur la location de voitures à Nador',
  description:
    "Réponses aux questions les plus courantes : comment réserver, dépôt de garantie, assurance, kilométrage, annulation et agences vérifiées CarDrive à Nador.",
  alternates: { canonical: '/faq' },
  openGraph: {
    title: 'FAQ — Location de voitures à Nador | CarDrive',
    description: 'Toutes les réponses sur la réservation, les tarifs, les garanties et les agences partenaires CarDrive à Nador.',
    url: 'https://cardrive.ma/faq',
  },
};

export default function FaqPage() {
  return <FaqClient />;
}
