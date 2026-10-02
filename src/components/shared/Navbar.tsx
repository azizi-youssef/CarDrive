'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Car, Search, Menu, X, ShieldCheck, Building2, User, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/search', label: 'Véhicules' },
    { href: '/agencies', label: 'Agences Nador' },
    { href: '/about', label: 'Comment ça marche' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#046c7a] to-[#0891b2] flex items-center justify-center text-white shadow-md shadow-teal-900/10 group-hover:scale-105 transition-transform">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Car<span className="text-[#046c7a]">Drive</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-[#046c7a] px-1.5 py-0.5 rounded border border-teal-200/60">
                  Nador
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Marketplace Automobile Locale
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-3.5 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'text-[#046c7a] bg-teal-50/70 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/agency"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#046c7a] rounded-lg border border-slate-200 hover:border-teal-200 hover:bg-teal-50/30 transition-all"
            >
              <Building2 className="w-3.5 h-3.5 text-[#046c7a]" />
              Espace Agence
            </Link>

            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Admin
            </Link>

            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#046c7a] hover:bg-[#03525d] shadow-sm hover:shadow transition-all"
            >
              <Search className="w-4 h-4" />
              <span>Trouver une voiture</span>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Ouvrir le menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-100"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <Link
              href="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-3 rounded-xl font-semibold text-white bg-[#046c7a] flex items-center justify-center gap-2 shadow"
            >
              <Search className="w-4 h-4" />
              Rechercher un véhicule
            </Link>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/agency"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2.5 rounded-lg text-xs font-semibold text-slate-700 border border-slate-200"
              >
                Espace Agence
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2.5 rounded-lg text-xs font-semibold text-slate-700 border border-slate-200"
              >
                Super Admin
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
