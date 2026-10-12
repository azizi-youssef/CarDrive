'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Les routes d'administration et agence ont leurs propres interfaces et layouts
  const isAdminOrAgency =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/agency');

  if (isAdminOrAgency) {
    return <>{children}</>;
  }

  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-[#0B1220] focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        Aller au contenu principal
      </a>

      <Navbar />

      <main id="contenu" className="flex-1">
        {children}
      </main>

      <Footer />
    </>
  );
}
