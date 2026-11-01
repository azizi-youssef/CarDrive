'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SearchBar } from '@/components/search/SearchBar';
import { VehicleCard } from '@/components/cars/VehicleCard';
import { AgencyCard } from '@/components/agencies/AgencyCard';
import { loginUrl } from '@/lib/auth/login-portals';
import { useRealtimeRefresh } from '@/lib/supabase/realtime';
import type { Vehicle, Agency } from '@/types';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { ShinyText, Magnet, GsapReveal } from '@/components/ui/react-bits';

import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  MapPin,
  Plane,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

/* ── Transparency Accordion Item ────────────────────────────────────── */
function TranspItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 py-4 text-left text-sm font-semibold text-slate-800 transition hover:text-[#E63946]"
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="pb-4 text-xs sm:text-sm leading-relaxed text-slate-600">{children}</p>
      )}
    </div>
  );
}

export default function HomePage() {
  const { t, isRTL } = useTranslation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const load = useCallback(async () => {
    setHasError(false);
    try {
      const [vRes, aRes] = await Promise.all([
        fetch('/api/vehicles', { next: { revalidate: 60 } } as RequestInit).then((r) => r.json()),
        fetch('/api/agencies', { next: { revalidate: 60 } } as RequestInit).then((r) => r.json()),
      ]);

      if (vRes?.success && Array.isArray(vRes.data)) {
        setVehicles(vRes.data);
      } else {
        setHasError(true);
      }

      if (aRes?.success && Array.isArray(aRes.data)) {
        setAgencies(aRes.data);
      } else {
        setHasError(true);
      }
    } catch (err) {
      console.warn('Error loading home data:', err);
      setHasError(true);
    } finally {
      setDataLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setTimeout(() => setHeroLoaded(true), 100);
    return () => clearTimeout(timer);
  }, [load]);

  useRealtimeRefresh({
    tables: ['vehicles', 'agencies', 'bookings'],
    onRefresh: load,
    pollingIntervalMs: 60_000,
  });

  const featuredVehicles = vehicles;
  const featuredAgencies = agencies.slice(0, 4);

  const totalVehicles = vehicles.length;
  const totalAgencies = agencies.length;

  const getCategoryCount = (cat: string) => vehicles.filter((v) => v.category === cat).length;
  const getAutoCount = () => vehicles.filter((v) => v.transmission === 'AUTOMATIC').length;

  // Catégories harmonisées avec visuels locaux exclusivement
  const categories = [
    { name: 'Économique', count: getCategoryCount('Économique'), image: '/economique.jpeg', description: 'Pratique & économique' },
    { name: 'SUV', count: getCategoryCount('SUV'), image: '/suv.jpeg', description: 'Confort & espace' },
    { name: 'Berline', count: getCategoryCount('Berline'), image: '/Mercedes%20Class%20C%20220%20D.jpeg', description: 'Élégance au quotidien' },
    { name: 'Luxe', count: getCategoryCount('Luxe'), image: '/luxe.jpeg', description: 'Prestige & confort' },
    { name: 'Automatique', count: getAutoCount(), image: '/renault-kardian.jpeg', description: 'Conduite sans effort' },
    { name: '7 places', count: getCategoryCount('7 places'), image: '/voiture%207%20places.jpeg', description: 'Famille & groupes' },
  ];

  const destinations = [
    { name: 'Aéroport Nador-Al Aroui', shortName: 'Aéroport', image: '/aeroport%20nador%20al%20aroui.jpeg', icon: Plane, tag: 'Populaire' },
    { name: 'Nador Centre', shortName: 'Nador', image: '/centre%20nadar.jpeg', icon: MapPin, tag: null },
    { name: 'Port Beni Ansar', shortName: 'Beni Ansar', image: '/frontera%20melilla.jpeg', icon: MapPin, tag: 'MRE' },
    { name: 'Marchica & alentours', shortName: 'Marchica', image: '/atalayoun%20nador.jpg', icon: MapPin, tag: null },
  ];

  // Bande de confiance unifiée, cohérente et lisible sur tous les écrans
  const unifiedTrustItems = [
    {
      icon: ShieldCheck,
      title: dataLoaded && totalAgencies > 0 ? `${totalAgencies} agences locales référencées` : 'Agences locales auditées',
      description: 'Registre de commerce, assurance RC et flotte inspectés avant validation sur la plateforme.',
    },
    {
      icon: FileText,
      title: 'Demande sans débit direct',
      description: 'Aucun paiement préalable en ligne. Vous réglez directement à l’agence lors de la remise des clés.',
    },
    {
      icon: MapPin,
      title: 'Prise en charge à Nador',
      description: 'Livraison au terminal de l’Aéroport Al-Aroui, au port de Beni Ansar, en ville ou à votre hébergement.',
    },
    {
      icon: Clock3,
      title: 'Support client local',
      description: 'Une équipe locale joignable du lundi au samedi (9h00–18h00) pour répondre à vos questions.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Recherchez & Comparez',
      badge: 'Transparence totale',
      description:
        'Indiquez vos dates d’arrivée et de départ à Nador (Aéroport Al-Aroui, Port Beni Ansar, Centre ou Marchica). Comparez les tarifs réels, les options et les conditions de chaque agence locale.',
      icon: Search,
      highlights: ['Aéroport & Port de Nador', 'Tarifs réels des agences', 'Kilométrage clair'],
    },
    {
      number: '02',
      title: 'Demandez sans paiement',
      badge: '0 DH en ligne',
      description:
        'Transmettez votre demande en 1 minute sans renseigner de carte bancaire. Aucun débit préalable n’est effectué : votre dossier est transmis directement au responsable de l’agence partenaire.',
      icon: FileText,
      highlights: ['Pas de carte requise', 'Zéro frais de dossier', 'Dossier transmis au loueur'],
      accent: true,
    },
    {
      number: '03',
      title: 'Confirmation & Clés en main',
      badge: 'Règlement sur place',
      description:
        'L’agence confirme la disponibilité sous 24 h ouvrées. Le jour J, vous signez le contrat de location officiel, effectuez le dépôt de caution et réglez directement sur place à la remise des clés.',
      icon: CheckCircle2,
      highlights: ['Validation sous 24 h', 'Contrat officiel agence', 'Paiement à la remise des clés'],
    },
  ];

  return (
    <div className={`min-h-screen bg-[#F8FAFC] text-slate-900${isRTL ? ' is-rtl' : ''}`}>

      {/* ================================================================
          HERO — Compact, recherche directement accessible sans défilement
      ================================================================= */}
      <section className="relative overflow-hidden bg-[#070B12] text-white py-12 sm:py-20 lg:py-24">

        {/* Image d'arrière-plan */}
        <div className="absolute inset-0">
          <Image
            src="/background.png"
            alt="CarDrive — Location de voitures à Nador"
            fill
            priority
            sizes="100vw"
            className={`object-cover object-center transition-all duration-1000 ${heroLoaded ? 'scale-100 opacity-100' : 'scale-105 opacity-0'}`}
          />
          <div className="absolute inset-0 bg-[#05080D]/45" />
          <div className="absolute inset-0 bg-linear-to-r from-[#05080D]/90 via-[#05080D]/50 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-[#05080D]/95 via-transparent to-[#05080D]/20" />
        </div>

        {/* Éléments graphiques d'ambiance */}
        <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-30" />
        <div className="animate-cd-drift pointer-events-none absolute -right-20 top-20 h-100 w-100 rounded-full bg-[#E63946]/8 blur-[100px]" />
        <div className="pointer-events-none absolute -left-40 bottom-0 h-75 w-75 rounded-full bg-blue-600/5 blur-[80px]" />

        {/* Contenu Hero */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={`max-w-5xl transition-all duration-700 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

            {/* Titre et badges d'accroche */}
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md shadow-2xs">
                <span className="live-dot" />
                <ShinyText text={t.hero.eyebrow} className="text-white" />
                <span className="h-3 w-px bg-white/20" />
                <span className="text-[11px] font-normal text-white/70">Nador · Oriental</span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl text-crisp">
                Votre voiture.{' '}
                <span className="text-white/50">Votre liberté.</span>{' '}
                <span className="text-[#E63946]">À Nador.</span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                {t.hero.subtitle}
              </p>
            </div>

            {/* Formulaire de recherche — visible dès l'ouverture */}
            <div className="relative z-20 mt-6 max-w-5xl">
              <div className="rounded-2xl border border-white/15 bg-white/96 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-3 sm:rounded-3xl">
                <SearchBar />
              </div>

              {/* Raccourcis marques avec effet magnétique */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-white/50 text-[11px] font-medium">Marques populaires :</span>
                {['Dacia', 'Renault', 'Volkswagen', 'Hyundai', 'Peugeot'].map((brand) => (
                  <Magnet key={brand} strength={0.25}>
                    <Link
                      href={`/search?brand=${encodeURIComponent(brand)}`}
                      className="inline-block rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/80 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
                    >
                      {brand}
                    </Link>
                  </Magnet>
                ))}
              </div>
            </div>

              {/* Micro-réassurance discrète & lien vers le guide */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-slate-300">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>0 DH payé en ligne</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#E63946] shrink-0" />
                    <span>Agences locales auditées</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span>Aéroport Al-Aroui & Port Beni Ansar</span>
                  </span>
                </div>
                <a
                  href="#comment-ca-marche"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 transition hover:text-white"
                >
                  <span>Comment ça fonctionne ?</span>
                  <ArrowRight className="h-3 w-3" />
                </a>
              </div>

          </div>
        </div>
      </section>

      {/* ================================================================
          BANDE DE CONFIANCE UNIQUE — Fusionnée, lisible et factuelle
      ================================================================= */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <GsapReveal
            stagger={0.1}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-slate-100"
          >
            {unifiedTrustItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className={`flex items-start gap-3.5 ${idx > 0 ? 'lg:pl-6' : ''}`}>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B1220] text-white shadow-sm">
                    <Icon className="h-5 w-5 text-[#E63946]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 leading-snug">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </GsapReveal>
        </div>
      </section>

      {/* ================================================================
          CATEGORIES — "Trouvez votre style" (visuels locaux homogènes)
      ================================================================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="section-header-eyebrow">
              <span className="h-3 w-3 rounded-full bg-[#E63946]" />
              Explorer
            </p>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Trouvez votre style
            </h2>
            <p className="mt-2 text-sm text-slate-500">Du modèle économique au véhicule familial ou premium.</p>
          </div>
          <Link href="/search" className="hidden items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[#E63946] sm:flex">
            Tous les véhicules <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/search?category=${encodeURIComponent(category.name)}`}
              className="group relative aspect-[0.88] overflow-hidden rounded-2xl bg-slate-900"
            >
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover transition duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-0.5 scale-x-0 bg-[#E63946] transition-transform duration-300 group-hover:scale-x-100" />

              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="text-sm font-black text-white">{category.name}</div>
                <div className="mt-0.5 text-[11px] text-white/70">{category.description}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-white/60">
                    {category.count > 0 ? `${category.count} véh.` : 'Voir'}
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 transition group-hover:bg-[#E63946]">
                    <ArrowUpRight className="h-3.5 w-3.5 text-white" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ================================================================
          FEATURED VEHICLES — Distinction nette entre erreur et absence
      ================================================================= */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="section-header-eyebrow">
                <span className="h-3 w-3 rounded-full bg-[#E63946]" />
                Sélection CarDrive
              </p>
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Les véhicules populaires
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Consultez les caractéristiques et transmettez votre demande pour vos dates de séjour.
              </p>
            </div>
            <Link
              href="/search"
              className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#E63946]/30 hover:text-[#E63946] hover:shadow-md sm:flex"
            >
              Tout explorer <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* État d'erreur technique explicite */}
          {hasError ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50/60 p-8 text-center sm:p-12">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Impossible de charger les véhicules</h3>
              <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-600">
                Une interruption temporaire de connexion empêche d&apos;afficher les véhicules en direct.
              </p>
              <button
                type="button"
                onClick={() => { setDataLoaded(false); void load(); }}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0B1220] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Réessayer
              </button>
            </div>
          ) : !dataLoaded ? (
            /* Chargement skeleton */
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-80 rounded-2xl" />
              ))}
            </div>
          ) : featuredVehicles.length === 0 ? (
            /* Absence réelle de données (plateforme en cours de déploiement) */
            <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-[#F6F5F1] p-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Car className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Consultez la flotte par destination</h3>
              <p className="mt-1.5 max-w-md text-xs leading-5 text-slate-500">
                Les véhicules sont gérés en direct par les agences locales à Nador. Utilisez le formulaire de recherche ci-dessus pour afficher les disponibilités exactes pour vos dates.
              </p>
              <Link href="/search" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B1220] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800">
                <Search className="h-3.5 w-3.5" />
                Lancer une recherche de véhicule
              </Link>
            </div>
          ) : (
            /* Grille de véhicules réelle */
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featuredVehicles.map((vehicle, index) => (
                <div key={vehicle.id} className="card-hover transition duration-300">
                  <VehicleCard vehicle={vehicle} priority={index < 3} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-center sm:hidden">
            <Link href="/search" className="btn-primary px-5 py-3 text-sm">
              Voir tous les véhicules <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================
          CARDRIVE DIFFERENTIATOR — Exemple explicite et non ambigu
      ================================================================= */}
      <section className="relative overflow-hidden bg-[#080D16] py-20 text-white sm:py-28">
        <div className="absolute inset-0 bg-line-grid opacity-60" />
        <div className="animate-cd-drift pointer-events-none absolute -left-40 top-1/2 h-125 w-125 -translate-y-1/2 rounded-full bg-[#E63946]/8 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-64 w-64 rounded-full bg-blue-500/4 blur-[80px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_1fr]">
            {/* Explications */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E63946]/25 bg-[#E63946]/10 px-3.5 py-2 text-xs font-bold text-[#FF6B75]">
                <Sparkles className="h-3.5 w-3.5" />
                {t.differentiator.badge}
              </div>

              <h2 className="max-w-xl text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl">
                {t.differentiator.title}
                <br />
                <span className="text-[#E63946]">{t.differentiator.titleAccent}</span>
              </h2>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
                {t.differentiator.desc}
              </p>

              <div className="mt-8 space-y-3.5">
                {[t.differentiator.point1, t.differentiator.point2, t.differentiator.point3, t.differentiator.point4].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    </span>
                    <span className="text-sm font-medium text-slate-300">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/search" className="btn-accent px-6 py-3.5 text-sm">
                  {t.differentiator.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/about" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white">
                  En savoir plus
                </Link>
              </div>
            </div>

            {/* Maquette d'illustration explicitement libellée */}
            <div className="relative">
              <div className="absolute -inset-6 rounded-4xl bg-[#E63946]/4 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-[#111827] shadow-2xl">
                {/* Entête avec mention d'illustration */}
                <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">CarDrive Search</p>
                      <span className="rounded bg-amber-400/10 border border-amber-400/25 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                        Exemple illustratif · Données fictives
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-300">Démonstration de recherche d’alternatives</p>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                </div>

                <div className="space-y-4 p-5 sm:p-6">
                  {/* Véhicule demandé */}
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-white">Dacia Duster 2025</p>
                        <p className="mt-0.5 text-xs text-slate-500">Diesel · Automatique · 5 places</p>
                      </div>
                      <span className="badge badge-rented text-[10px]">Indisponible</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    3 alternatives équivalentes trouvées
                  </div>

                  {[
                    { agency: 'Agence Rif Drive', car: 'Duster 2024 Diesel', price: '340 DH' },
                    { agency: 'Agence Marchica Rent', car: 'Duster 2025 Auto', price: '380 DH' },
                    { agency: 'Agence Nador Auto', car: 'Duster 2024 Manuelle', price: '330 DH' },
                  ].map((alt, index) => (
                    <div
                      key={alt.agency}
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/3 p-3.5 transition hover:border-emerald-500/20 hover:bg-white/5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 font-mono text-[10px] font-bold text-slate-400">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-white">{alt.agency}</p>
                          <p className="mt-0.5 truncate text-[10px] text-slate-500">{alt.car}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-black text-white">{alt.price}</p>
                        <p className="text-[9px] text-slate-600">/ jour</p>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between border-t border-white/8 pt-3 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock3 className="h-3 w-3 text-slate-500" />
                      <span>Exemple simulé à titre de démonstration visuelle.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          DESTINATIONS
      ================================================================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10">
          <p className="section-header-eyebrow">
            <span className="h-3 w-3 rounded-full bg-[#E63946]" />
            Où récupérer votre voiture ?
          </p>
          <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Louez là où votre voyage commence
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Prise en charge directe aux principaux points d’arrivée à Nador.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {destinations.map((destination) => {
            const Icon = destination.icon;
            return (
              <Link
                href={`/search?location=${encodeURIComponent(destination.shortName)}`}
                key={destination.name}
                className="group relative aspect-[1.15] overflow-hidden rounded-2xl bg-slate-900"
              >
                <Image
                  src={destination.image}
                  alt={destination.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="image-zoom-subtle object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent" />
                <div className="absolute inset-0 bg-[#E63946]/0 transition-all duration-500 group-hover:bg-[#E63946]/12" />

                {destination.tag && (
                  <div className="absolute right-3 top-3">
                    <span className="badge badge-accent text-[9px]">{destination.tag}</span>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition group-hover:bg-[#E63946]">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm font-bold text-white sm:text-base">{destination.name}</p>
                  <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-white/70 transition group-hover:text-white">
                    Explorer les voitures
                    <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ================================================================
          HOW IT WORKS & TRANSPARENCE — Parcours clair et guidé
      ================================================================= */}
      <section id="comment-ca-marche" className="border-y border-slate-200 bg-white py-16 sm:py-24 scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="section-header-eyebrow justify-center">
              <span className="h-3 w-3 rounded-full bg-[#E63946]" />
              Parcours simple & transparent
            </p>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Comment fonctionne votre réservation
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-6 text-slate-600">
              Sur CarDrive, vous envoyez une <strong>demande sans aucun paiement en ligne</strong>. L’agence locale vérifie sa disponibilité et confirme sous 24 h.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative flex flex-col">
                  {index < steps.length - 1 && (
                    <div className="absolute left-[calc(50%+48px)] top-10 hidden h-0.5 w-[calc(100%-96px)] bg-linear-to-r from-slate-300 via-slate-200 to-transparent lg:block" />
                  )}
                  <div
                    className={`group flex flex-col flex-1 rounded-3xl border p-7 transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-100 ${
                      step.accent
                        ? 'border-[#0B1220]/15 bg-white hover:border-[#0B1220]/40'
                        : 'border-slate-200 bg-[#F8FAFC] hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-md transition duration-300 ${
                          step.accent
                            ? 'bg-[#0B1220] text-white group-hover:bg-[#E63946]'
                            : 'bg-[#0B1220] text-white group-hover:bg-[#E63946]'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-mono text-3xl font-black tracking-tight text-slate-300 transition group-hover:text-slate-400">
                        {step.number}
                      </span>
                    </div>

                    <div className="mt-6 flex items-center gap-2">
                      <span className="inline-flex rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                        Étape {index + 1}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          step.accent ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {step.badge}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-black text-slate-950 sm:text-xl">{step.title}</h3>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 flex-1">{step.description}</p>

                    <div className="mt-5 pt-4 border-t border-slate-200/80 space-y-2">
                      {step.highlights.map((item) => (
                        <div key={item} className="flex items-center gap-2 text-xs text-slate-700">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Call to action sous les étapes */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-[#E63946] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-950/15 transition hover:bg-[#C92F3B]"
            >
              <Search className="h-4 w-4" />
              Trouver un véhicule à Nador
            </Link>
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Consulter les questions fréquentes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Accordéon de transparence sur les coûts et conditions */}
          <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-slate-200 bg-[#F6F5F1] p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#E63946]" />
              <h3 className="text-sm font-bold text-slate-900">Conditions et transparence</h3>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">À savoir avant votre demande</span>
            </div>
            <TranspItem title="Dépôt de garantie (caution)">
              Un dépôt de garantie est demandé par l’agence partenaire lors de la prise en charge (souvent bloqué par empreinte bancaire ou caution selon le véhicule). Il est intégralement restitué après la remise des clés sans dommage. Le montant exact figure sur chaque fiche véhicule.
            </TranspItem>
            <TranspItem title="Kilométrage">
              La plupart des offres de nos agences partenaires incluent le kilométrage illimité à partir de 3 jours de location. Vérifiez les détails de chaque fiche pour connaître le forfait exact.
            </TranspItem>
            <TranspItem title="Assurance incluse">
              Une assurance responsabilité civile de base est systématiquement comprise. Des garanties complémentaires (tous risques, rachat partiel de franchise) peuvent être souscrites directement avec le loueur.
            </TranspItem>
            <TranspItem title="Annulation et modification">
              Tant que votre demande n’a pas été formellement validée par l’agence, aucun frais n’est engagé. Si vous souhaitez modifier vos dates, vous pouvez contacter l’agence sans pénalité.
            </TranspItem>
            <TranspItem title="Comment sont auditées les agences partenaires ?">
              Avant de figurer sur CarDrive, chaque agence fournit son registre de commerce en règle, une attestation d’assurance responsabilité civile professionnelle valide et l’inventaire certifié de ses véhicules.
            </TranspItem>
          </div>
        </div>
      </section>

      {/* ================================================================
          AGENCIES — Distinction erreur vs déploiement
      ================================================================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="section-header-eyebrow">
              <span className="h-3 w-3 rounded-full bg-[#E63946]" />
              Nos partenaires
            </p>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Des agences locales de confiance
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Découvrez les professionnels vérifiés présents sur CarDrive.
            </p>
          </div>
          <Link href="/agencies" className="hidden items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[#E63946] sm:flex">
            Toutes les agences <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {hasError ? (
            /* État d'erreur technique */
            <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50/60 p-8 text-center sm:p-12">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Impossible de charger les agences</h3>
              <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-600">
                Une interruption temporaire empêche de charger les agences partenaires.
              </p>
              <button
                type="button"
                onClick={() => { setDataLoaded(false); void load(); }}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0B1220] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Réessayer
              </button>
            </div>
          ) : !dataLoaded ? (
            [1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-56 rounded-2xl" />)
          ) : featuredAgencies.length === 0 ? (
            /* Absence réelle de données (phase d'audit) */
            <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center sm:p-12">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <Building2 className="h-6 w-6 text-slate-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Agences locales de confiance en cours d&apos;audit</h3>
              <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-slate-500">
                Chaque agence de location partenaire soumet son registre de commerce, son assurance RC et son inventaire avant validation. Vous pouvez d&apos;ores et déjà lancer une recherche par destination.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link href="/search" className="inline-flex items-center gap-2 rounded-xl bg-[#E63946] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#C92F3B]">
                  <Search className="h-3.5 w-3.5" />
                  Rechercher une voiture
                </Link>
                <Link href="/agency/join" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
                  <Building2 className="h-3.5 w-3.5 text-[#0B1220]" />
                  Vous êtes une agence ? Rejoignez CarDrive
                </Link>
              </div>
            </div>
          ) : (
            featuredAgencies.map((agency) => (
              <div key={agency.id} className="card-hover transition duration-300">
                <AgencyCard
                  agency={agency}
                  carCount={agency.vehicle_count ?? vehicles.filter((v) => v.agency_id === agency.id).length}
                />
              </div>
            ))
          )}
        </div>
      </section>

      {/* ================================================================
          B2B CTA — Agences Partenaires
      ================================================================= */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
        <div className="relative overflow-hidden rounded-4xl bg-[#0B1220] px-6 py-12 text-white sm:px-10 sm:py-14 lg:px-14">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#E63946]/15 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute inset-0 bg-dot-grid opacity-30" />

          <div className="relative z-10 flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300">
                <Building2 className="h-3.5 w-3.5 text-[#E63946]" />
                CarDrive pour les professionnels
              </div>

              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                {t.footer.agencyBoxTitle}
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                {t.footer.agencyBoxDesc}
              </p>

              <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-400">
                {['Gestion de flotte', 'Réservations directes', 'Visibilité locale', 'Espace pro inclus'].map((f) => (
                  <span key={f} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto">
              <Link
                href="/agency/join"
                className="btn-accent inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm"
              >
                Rejoindre CarDrive
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-center text-xs text-slate-400 sm:text-left">
                Déjà partenaire ?{' '}
                <Link href={loginUrl('agency')} className="font-semibold text-white underline-offset-2 hover:underline">
                  Connexion agence
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
