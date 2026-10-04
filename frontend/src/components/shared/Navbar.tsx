
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Search,
  Menu,
  X,
  Building2,
  User,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Plane,
  Anchor,
  CarFront,
  Sparkles,
  ArrowRight,
  MapPin,
  ShieldCheck,
  Clock3,
  Star,
  LogIn,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ====================================================================== */
/* DESTINATIONS                                                           */
/* ====================================================================== */

const destinationItems = [
  {
    title: 'Aéroport Nador-Al Aroui',
    shortTitle: 'Aéroport Nador',
    href: '/location-voiture-nador-aeroport',
    desc: 'Location et prise en charge à l’aéroport',
    icon: Plane,
    tag: 'Populaire',
  },
  {
    title: 'Port de Beni Ansar',
    shortTitle: 'Port Beni Ansar',
    href: '/location-voiture-beni-ansar',
    desc: 'Solutions pour les arrivées en ferry',
    icon: Anchor,
    tag: 'MRE',
  },
  {
    title: 'Nador Centre & Marchica',
    shortTitle: 'Nador Centre',
    href: '/location-voiture-nador',
    desc: 'Véhicules disponibles au cœur de Nador',
    icon: MapPin,
  },
  {
    title: 'SUV & 4x4 à Nador',
    shortTitle: 'SUV & 4x4',
    href: '/location-voiture-nador-suv',
    desc: 'Duster, Tucson et autres SUV',
    icon: CarFront,
  },
  {
    title: 'Boîte automatique',
    shortTitle: 'Automatique',
    href: '/location-voiture-nador-automatique',
    desc: 'Confort et conduite simplifiée',
    icon: Sparkles,
  },
];

/* ====================================================================== */
/* MAIN NAVIGATION                                                        */
/* ====================================================================== */

const navLinks = [
  {
    href: '/',
    label: 'Accueil',
  },
  {
    href: '/search',
    label: 'Véhicules',
  },
  {
    href: '/agencies',
    label: 'Agences',
  },
  {
    href: '/about',
    label: 'Comment ça marche',
  },
  {
    href: '/faq',
    label: 'FAQ',
  },
];

/* ====================================================================== */
/* NAVBAR                                                                 */
/* ====================================================================== */

export function Navbar() {
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [destinationsOpen, setDestinationsOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);

  /* ------------------------------------------------------------------ */
  /* Scroll state                                                       */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  /* ------------------------------------------------------------------ */
  /* Close dropdowns when clicking outside                             */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setDestinationsOpen(false);
      }

      if (
        loginDropdownRef.current &&
        !loginDropdownRef.current.contains(target)
      ) {
        setLoginOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  /* ------------------------------------------------------------------ */
  /* Close menus when route changes                                    */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    setMobileMenuOpen(false);
    setDestinationsOpen(false);
    setLoginOpen(false);
  }, [pathname]);

  /* ------------------------------------------------------------------ */
  /* Lock body scroll on mobile                                        */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */

  const isNavActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }

    if (href === '/search') {
      return pathname === '/search' || pathname.startsWith('/search/');
    }

    if (href === '/agencies') {
      return pathname === '/agencies' || pathname.startsWith('/agencies/');
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-50 w-full">

      {/* ================================================================ */}
      {/* TOP BAR                                                          */}
      {/* ================================================================ */}

      <div className="hidden border-b border-slate-800/70 bg-[#0B1220] text-[10px] text-slate-400 sm:block">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

          {/* Left */}
          <div className="flex min-w-0 items-center gap-4">

            <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>

              <span className="hidden md:inline">
                Agences partenaires vérifiées
              </span>

              <span className="md:hidden">
                Agences vérifiées
              </span>
            </div>

            <span className="hidden h-3 w-px bg-slate-700 md:block" />

            <div className="hidden items-center gap-1.5 text-slate-500 lg:flex">
              <Plane className="h-3 w-3" />

              <span>
                Aéroport Nador-Al Aroui
              </span>

              <span className="text-slate-700">
                ·
              </span>

              <Anchor className="h-3 w-3" />

              <span>
                Port Beni Ansar
              </span>
            </div>
          </div>

          {/* Right */}
          <div className="flex shrink-0 items-center gap-4">

            <Link
              href="/agency/join"
              className="hidden items-center gap-1.5 text-slate-400 transition-colors hover:text-white lg:flex"
            >
              <Building2 className="h-3 w-3" />
              Devenir partenaire
            </Link>

            <Link
              href="/agency/login"
              className="hidden items-center gap-1.5 text-slate-400 transition-colors hover:text-white md:flex"
            >
              <Building2 className="h-3 w-3 text-amber-400" />
              Espace Agence
            </Link>

            <Link
              href="/account"
              className="flex items-center gap-1.5 font-medium text-slate-300 transition-colors hover:text-white"
            >
              <LogIn className="h-3 w-3 text-[#E63946]" />
              Connexion
            </Link>

            <span className="h-3 w-px bg-slate-800" />

            <a
              href="https://wa.me/212661987654?text=Bonjour%2C%20je%20souhaite%20louer%20un%20v%C3%A9hicule%20%C3%A0%20Nador"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
            >
              <MessageCircle className="h-3 w-3" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* MAIN NAVIGATION                                                   */}
      {/* ================================================================ */}

      <div
        className={cn(
          'border-b transition-all duration-300',
          scrolled
            ? 'border-slate-200/80 bg-white/95 shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-2xl'
            : 'border-slate-200/70 bg-white/90 backdrop-blur-xl'
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div
            className={cn(
              'flex items-center justify-between gap-4 transition-all duration-300',
              scrolled
                ? 'h-14'
                : 'h-16 sm:h-[68px]'
            )}
          >

            {/* ========================================================== */}
            {/* LOGO                                                        */}
            {/* ========================================================== */}

            <Link
              href="/"
              aria-label="CarDrive — Accueil"
              className="group flex shrink-0 items-center"
            >

              {/* Mobile icon */}
              <div className="relative h-9 w-9 sm:hidden">
                <Image
                  src="/icon_CarDrive1.png"
                  alt="CarDrive"
                  fill
                  sizes="36px"
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                  priority
                />
              </div>

              {/* Desktop logo */}
              <div
                className={cn(
                  'relative hidden transition-all duration-300 sm:block',
                  scrolled
                    ? 'h-9 w-[150px]'
                    : 'h-10 w-[165px]'
                )}
              >
                <Image
                  src="/logo_CarDrive1.png"
                  alt="CarDrive — Location de voitures à Nador"
                  fill
                  sizes="165px"
                  className="object-contain object-left transition-transform duration-300 group-hover:scale-[1.01]"
                  priority
                />
              </div>
            </Link>

            {/* ========================================================== */}
            {/* DESKTOP NAV                                                 */}
            {/* ========================================================== */}

            <nav
              aria-label="Navigation principale"
              className="hidden items-center gap-1 lg:flex"
            >

              {/* Main links */}
              {navLinks.map((link) => {
                const active = isNavActive(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200',
                      active
                        ? 'bg-slate-100 font-semibold text-[#0B1220]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-[#0B1220]'
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* -------------------------------------------------------- */}
              {/* DESTINATIONS DROPDOWN                                    */}
              {/* -------------------------------------------------------- */}

              <div
                ref={dropdownRef}
                className="relative"
              >
                <button
                  type="button"
                  aria-expanded={destinationsOpen}
                  aria-haspopup="menu"
                  onClick={() =>
                    setDestinationsOpen((current) => !current)
                  }
                  onMouseEnter={() =>
                    setDestinationsOpen(true)
                  }
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200',
                    destinationsOpen
                      ? 'bg-slate-100 font-semibold text-[#0B1220]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-[#0B1220]'
                  )}
                >
                  Destinations

                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 text-slate-400 transition-transform duration-200',
                      destinationsOpen && 'rotate-180'
                    )}
                  />
                </button>

                {destinationsOpen && (
                  <div
                    role="menu"
                    onMouseLeave={() =>
                      setDestinationsOpen(false)
                    }
                    className="absolute left-1/2 top-full z-50 mt-2 w-[350px] -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.14)]"
                    style={{
                      animation:
                        'carDriveDropdown 160ms ease-out',
                    }}
                  >

                    {/* Header */}
                    <div className="px-3 pb-2 pt-2">
                      <div className="flex items-center justify-between">

                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Explorer par destination
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-500">
                            Trouvez une voiture selon votre point d'arrivée.
                          </p>
                        </div>

                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        </div>

                      </div>
                    </div>

                    <div className="my-1 border-t border-slate-100" />

                    {/* Items */}
                    <div className="space-y-0.5">

                      {destinationItems.map((item) => {
                        const Icon = item.icon;

                        const active =
                          pathname === item.href;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            role="menuitem"
                            className={cn(
                              'group flex items-center gap-3 rounded-xl p-2.5 transition-all duration-200',
                              active
                                ? 'bg-slate-100'
                                : 'hover:bg-slate-50'
                            )}
                          >

                            <span
                              className={cn(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
                                active
                                  ? 'bg-[#E63946]/10 text-[#E63946]'
                                  : 'bg-slate-100 text-slate-500 group-hover:bg-[#E63946]/10 group-hover:text-[#E63946]'
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </span>

                            <span className="min-w-0 flex-1">

                              <span className="flex items-center gap-2">

                                <span className="truncate text-[11px] font-semibold text-slate-900">
                                  {item.title}
                                </span>

                                {item.tag && (
                                  <span className="shrink-0 rounded-full bg-[#E63946]/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#E63946]">
                                    {item.tag}
                                  </span>
                                )}

                              </span>

                              <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                                {item.desc}
                              </span>

                            </span>

                            <ArrowRight
                              className="h-3.5 w-3.5 shrink-0 text-slate-300 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#E63946] group-hover:opacity-100"
                            />

                          </Link>
                        );
                      })}

                    </div>

                    {/* Footer */}
                    <div className="mt-1 border-t border-slate-100 px-3 pb-1 pt-2.5">

                      <Link
                        href="/search"
                        className="group flex items-center justify-between"
                      >

                        <span className="flex items-center gap-2 text-[10px] text-slate-500">
                          <Search className="h-3 w-3" />
                          Voir tous les véhicules
                        </span>

                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#E63946]">
                          Rechercher

                          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </span>

                      </Link>

                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* ========================================================== */}
            {/* DESKTOP ACTIONS                                             */}
            {/* ========================================================== */}

            <div className="hidden items-center gap-2.5 sm:flex">

              {/* -------------------------------------------------------- */}
              {/* LOGIN DROPDOWN                                           */}
              {/* -------------------------------------------------------- */}

              <div
                ref={loginDropdownRef}
                className="relative"
              >

                <button
                  type="button"
                  aria-expanded={loginOpen}
                  aria-haspopup="menu"
                  onClick={() =>
                    setLoginOpen((prev) => !prev)
                  }
                  onMouseEnter={() =>
                    setLoginOpen(true)
                  }
                  className={cn(
                    'group inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 active:scale-[0.98]',
                    loginOpen &&
                    'border-slate-300 bg-slate-50 text-slate-950 ring-2 ring-slate-100'
                  )}
                >

                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors group-hover:bg-[#E63946]/10 group-hover:text-[#E63946]">
                    <User className="h-3.5 w-3.5" />
                  </span>

                  <span>
                    Connexion
                  </span>

                  <ChevronDown
                    className={cn(
                      'h-3 w-3 text-slate-400 transition-transform duration-200',
                      loginOpen &&
                      'rotate-180 text-slate-600'
                    )}
                  />

                </button>

                {loginOpen && (
                  <div
                    role="menu"
                    onMouseLeave={() =>
                      setLoginOpen(false)
                    }
                    className="absolute right-0 top-full z-50 mt-2 w-[310px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.14)]"
                    style={{
                      animation:
                        'carDriveLoginDropdown 160ms ease-out',
                    }}
                  >

                    {/* Header */}
                    <div className="px-3 pb-2 pt-2">

                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Espaces d'accès
                      </p>

                      <p className="mt-0.5 text-xs font-bold text-slate-900">
                        Connectez-vous à votre espace
                      </p>

                    </div>

                    <div className="my-1 border-t border-slate-100" />

                    {/* Client */}
                    <Link
                      href="/account"
                      role="menuitem"
                      onClick={() =>
                        setLoginOpen(false)
                      }
                      className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50"
                    >

                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                        <User className="h-4 w-4" />
                      </span>

                      <span className="min-w-0 flex-1">

                        <span className="flex items-center justify-between">

                          <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                            Espace Client
                          </span>

                          <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[8px] font-bold text-blue-600">
                            Réservations
                          </span>

                        </span>

                        <span className="mt-0.5 block text-[10px] text-slate-500">
                          Vos réservations, devis & favoris
                        </span>

                      </span>
                    </Link>

                    {/* Agency */}
                    <Link
                      href="/agency/login"
                      role="menuitem"
                      onClick={() =>
                        setLoginOpen(false)
                      }
                      className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50"
                    >

                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                        <Building2 className="h-4 w-4" />
                      </span>

                      <span className="min-w-0 flex-1">

                        <span className="flex items-center justify-between">

                          <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-600">
                            Espace Agence
                          </span>

                          <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-bold uppercase text-emerald-600">
                            Pro
                          </span>

                        </span>

                        <span className="mt-0.5 block text-[10px] text-slate-500">
                          Gérer la flotte, tarifs & planning
                        </span>

                      </span>
                    </Link>

                    {/* Admin */}
                    <Link
                      href="/admin/login"
                      role="menuitem"
                      onClick={() =>
                        setLoginOpen(false)
                      }
                      className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50"
                    >

                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors group-hover:bg-slate-900 group-hover:text-white">
                        <ShieldCheck className="h-4 w-4" />
                      </span>

                      <span className="min-w-0 flex-1">

                        <span className="text-xs font-bold text-slate-900 group-hover:text-slate-950">
                          Administration
                        </span>

                        <span className="mt-0.5 block text-[10px] text-slate-500">
                          Gestion globale de la plateforme
                        </span>

                      </span>
                    </Link>

                    {/* Footer */}
                    <div className="mt-1 border-t border-slate-100 px-3 pb-1 pt-2.5">

                      <Link
                        href="/agency/join"
                        onClick={() =>
                          setLoginOpen(false)
                        }
                        className="group flex items-center justify-between text-[11px]"
                      >

                        <span className="text-slate-500">
                          Vous êtes loueur ?
                        </span>

                        <span className="flex items-center gap-1 font-bold text-[#E63946] group-hover:underline">
                          Inscrire mon agence

                          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </span>

                      </Link>

                    </div>
                  </div>
                )}
              </div>

              {/* Search CTA */}
              <Link
                href="/search"
                className="group inline-flex items-center gap-2 rounded-xl bg-[#E63946] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-red-900/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#C92F3B] hover:shadow-md active:translate-y-0"
              >

                <Search className="h-3.5 w-3.5" />

                <span className="hidden xl:inline">
                  Trouver un véhicule
                </span>

                <span className="xl:hidden">
                  Rechercher
                </span>

                <ArrowRight className="h-3 w-3 opacity-70 transition-transform group-hover:translate-x-0.5" />

              </Link>
            </div>

            {/* ========================================================== */}
            {/* MOBILE ACTIONS                                              */}
            {/* ========================================================== */}

            <div className="flex items-center gap-2 sm:hidden">

              <Link
                href="/account"
                aria-label="Connexion / Mon compte"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50"
              >
                <User className="h-4 w-4" />
              </Link>

              <Link
                href="/search"
                aria-label="Rechercher un véhicule"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E63946]/10 text-[#E63946] transition-colors hover:bg-[#E63946]/15"
              >
                <Search className="h-4 w-4" />
              </Link>

              <button
                type="button"
                aria-label={
                  mobileMenuOpen
                    ? 'Fermer le menu'
                    : 'Ouvrir le menu'
                }
                aria-expanded={mobileMenuOpen}
                onClick={() =>
                  setMobileMenuOpen((current) => !current)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-50"
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* MOBILE MENU                                                      */}
      {/* ================================================================ */}

      {mobileMenuOpen && (
        <div className="fixed inset-x-0 bottom-0 top-[56px] z-40 overflow-y-auto border-b border-slate-200 bg-white shadow-2xl lg:hidden">

          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">

            {/* Main CTA */}
            <Link
              href="/search"
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="group flex items-center justify-between rounded-2xl bg-[#E63946] p-4 text-white shadow-lg shadow-red-900/10"
            >

              <span className="flex items-center gap-3">

                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                  <Search className="h-4 w-4" />
                </span>

                <span>

                  <span className="block text-sm font-bold">
                    Trouver une voiture
                  </span>

                  <span className="mt-0.5 block text-[10px] text-white/70">
                    Rechercher parmi les véhicules disponibles
                  </span>

                </span>

              </span>

              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />

            </Link>

            {/* Navigation */}
            <div className="mt-5">

              <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Navigation
              </p>

              <nav className="space-y-1">

                {navLinks.map((link) => {
                  const active = isNavActive(link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() =>
                        setMobileMenuOpen(false)
                      }
                      className={cn(
                        'flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                        active
                          ? 'bg-slate-100 font-semibold text-[#0B1220]'
                          : 'text-slate-700 hover:bg-slate-50'
                      )}
                    >

                      <span>
                        {link.label}
                      </span>

                      <ArrowRight className="h-3.5 w-3.5 text-slate-300" />

                    </Link>
                  );
                })}

                {/* Destinations mobile */}
                <div className="pt-1">

                  <button
                    type="button"
                    onClick={() =>
                      setDestinationsOpen(
                        (current) => !current
                      )
                    }
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                      destinationsOpen
                        ? 'bg-slate-100 font-semibold text-[#0B1220]'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >

                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      Destinations
                    </span>

                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-slate-400 transition-transform',
                        destinationsOpen &&
                        'rotate-180'
                      )}
                    />

                  </button>

                  {destinationsOpen && (
                    <div className="mt-1 space-y-1 pl-2">

                      {destinationItems.map((item) => {
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() =>
                              setMobileMenuOpen(false)
                            }
                            className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50"
                          >

                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:text-[#E63946]">
                              <Icon className="h-3.5 w-3.5" />
                            </span>

                            <span className="min-w-0 flex-1">

                              <span className="block truncate text-[11px] font-semibold text-slate-800">
                                {item.shortTitle}
                              </span>

                              {item.tag && (
                                <span className="mt-0.5 block text-[8px] font-bold uppercase tracking-wide text-[#E63946]">
                                  {item.tag}
                                </span>
                              )}

                            </span>

                            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />

                          </Link>
                        );
                      })}

                    </div>
                  )}
                </div>
              </nav>
            </div>

            {/* Connexion / Espaces */}
            <div className="mt-6 border-t border-slate-100 pt-5">

              <div className="mb-3 flex items-center justify-between px-2">

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Connexion & Espaces
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Accédez à votre compte
                  </p>
                </div>

                <LogIn className="h-4 w-4 text-slate-400" />

              </div>

              <div className="space-y-2">

                {/* Client */}
                <Link
                  href="/account"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition-colors hover:bg-white"
                >

                  <div className="flex items-center gap-3">

                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100/70 text-blue-700">
                      <User className="h-4 w-4" />
                    </span>

                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Espace Client
                      </p>

                      <p className="text-[10px] text-slate-500">
                        Mes réservations & profil
                      </p>
                    </div>

                  </div>

                  <ChevronRight className="h-4 w-4 text-slate-400" />

                </Link>

                {/* Agency */}
                <Link
                  href="/agency/login"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition-colors hover:bg-white"
                >

                  <div className="flex items-center gap-3">

                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100/70 text-emerald-700">
                      <Building2 className="h-4 w-4" />
                    </span>

                    <div>

                      <div className="flex items-center gap-1.5">

                        <p className="text-xs font-bold text-slate-900">
                          Espace Agence
                        </p>

                        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700">
                          PRO
                        </span>

                      </div>

                      <p className="text-[10px] text-slate-500">
                        Gestion de la flotte automobile
                      </p>

                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-slate-400" />

                </Link>

                {/* Admin */}
                <Link
                  href="/admin/login"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition-colors hover:bg-white"
                >

                  <div className="flex items-center gap-3">

                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-200/70 text-slate-700">
                      <ShieldCheck className="h-4 w-4" />
                    </span>

                    <div>

                      <p className="text-xs font-bold text-slate-900">
                        Administration
                      </p>

                      <p className="text-[10px] text-slate-500">
                        Accès administrateur CarDrive
                      </p>

                    </div>

                  </div>

                  <ChevronRight className="h-4 w-4 text-slate-400" />

                </Link>

              </div>
            </div>

            {/* WhatsApp */}
            <a
              href="https://wa.me/212661987654?text=Bonjour%2C%20je%20veux%20louer%20une%20voiture%20%C3%A0%20Nador"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100"
            >

              <MessageCircle className="h-4 w-4 text-emerald-600" />

              Assistance WhatsApp CarDrive

            </a>

            {/* Trust indicators */}
            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-slate-100 pt-5">

              <div className="rounded-xl bg-slate-50 p-3 text-center">

                <ShieldCheck className="mx-auto h-4 w-4 text-emerald-500" />

                <p className="mt-1.5 text-[9px] font-semibold text-slate-600">
                  Partenaires vérifiés
                </p>

              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-center">

                <Star className="mx-auto h-4 w-4 text-amber-500" />

                <p className="mt-1.5 text-[9px] font-semibold text-slate-600">
                  Prix transparents
                </p>

              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-center">

                <Clock3 className="mx-auto h-4 w-4 text-blue-500" />

                <p className="mt-1.5 text-[9px] font-semibold text-slate-600">
                  Disponibilité
                </p>

              </div>

            </div>

            {/* Location */}
            <div className="mt-6 flex items-center justify-center gap-1.5 pb-5 text-[10px] text-slate-400">

              <MapPin className="h-3 w-3" />

              Nador · Oriental · Maroc

            </div>

          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ANIMATIONS                                                       */}
      {/* ================================================================ */}

      <style jsx>{`

        @keyframes carDriveDropdown {
          from {
            opacity: 0;
            transform: translate(-50%, -6px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }

        @keyframes carDriveLoginDropdown {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

      `}</style>

    </header>
  );
}
