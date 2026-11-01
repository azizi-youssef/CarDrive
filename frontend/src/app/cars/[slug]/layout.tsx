import type { Metadata } from 'next';
import React from 'react';

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug).replace(/-/g, ' ');
  const formattedName = decoded.charAt(0).toUpperCase() + decoded.slice(1);

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
