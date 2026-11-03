import type { Metadata } from 'next';
import React from 'react';

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  // « hyundai-tucson-2026-w7lry » → « Hyundai Tucson 2026 » (le suffixe aléatoire après l'année est retiré)
  const decoded = decodeURIComponent(slug)
    .replace(/-((?:19|20)\d{2})-[a-z0-9]{3,8}$/i, '-$1')
    .replace(/-/g, ' ');
  const formattedName = decoded.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());

  return {
    title: `Louer ${formattedName} à Nador | CarDrive`,
    description: `Réservez ${formattedName} auprès d'agences vérifiées à Nador, Aéroport Nador-Al Aroui et Port Beni Ansar. Conditions transparentes et demande sans paiement immédiat.`,
    alternates: { canonical: `/cars/${slug}` },
    openGraph: {
      title: `${formattedName} en location à Nador — CarDrive`,
      description: `Consultez les caractéristiques, tarifs et avis pour ${formattedName} à Nador.`,
      url: `https://cardrive.ma/cars/${slug}`,
    },
  };
}

export default function CarSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
