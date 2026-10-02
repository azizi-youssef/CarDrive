import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';

export const metadata: Metadata = {
  title: 'CarDrive Nador — Location de Voitures & Comparateur Multi-Agences',
  description:
    'Comparez et louez votre voiture à Nador directement auprès des meilleures agences locales vérifiées. Disponibilité en temps réel à l’Aéroport Nador Al-Aroui, Port de Beni Ansar et Marchica.',
  keywords: [
    'location voiture nador',
    'location voiture nador aeroport',
    'rent a car nador',
    'location voiture beni ansar',
    'marchica nador voiture',
    'car rental nador morocco',
    'agences location nador',
  ],
  openGraph: {
    title: 'CarDrive Nador — Location de Voitures Multi-Agences',
    description: 'Ne cherchez plus une agence. Cherchez directement la voiture dont vous avez besoin à Nador.',
    locale: 'fr_FR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#0F172A] selection:bg-[#046c7a] selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
