'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SearchBar } from '@/components/search/SearchBar';
import { BrandMarquee, normalizeBrandKey } from '@/components/shared/BrandMarquee';
import { SUPPORT_HOURS_SUMMARY } from '@/lib/constants/contact';
import { VehicleCard } from '@/components/cars/VehicleCard';
import { AgencyCard } from '@/components/agencies/AgencyCard';
import { loginUrl } from '@/lib/auth/login-portals';
import { useRealtimeRefresh } from '@/lib/supabase/realtime';
import type { Vehicle, Agency } from '@/types';
import { isMotorcycle } from '@/lib/vehicles/kind';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { GsapReveal } from '@/components/ui/react-bits';

import {
  AlertCircle,
  ArrowRight,
  Motorbike,
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
        className="flex w-full items-center justify-between gap-3 py-4 text-left text-sm font-semibold text-slate-800 transition hover:text-accent-text"
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

export function HomeClient({
  initialVehicles,
  initialAgencies,
}: {
  /** Préchargés côté serveur (null si indisponibles : chargement côté navigateur) */
  initialVehicles: Vehicle[] | null;
  initialAgencies: Agency[] | null;
}) {
  const { t, isRTL } = useTranslation();
  const preloaded = initialVehicles !== null && initialAgencies !== null;
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles ?? []);
  const [agencies, setAgencies] = useState<Agency[]>(initialAgencies ?? []);
  const [dataLoaded, setDataLoaded] = useState(preloaded);
  const [hasError, setHasError] = useState(false);
  // Filtres rapides section véhicules
  const [vehicleFilter, setVehicleFilter] = useState<string>('Tous');
  // Budget max filtre (0 = pas de limite)
  const [budgetMax, setBudgetMax] = useState<number>(0);
  // Jours sélectionnés pour prix total estimé
  const [selectedDays, setSelectedDays] = useState<number>(0);

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

  // Données déjà rendues côté serveur : pas de second chargement ; le rafraîchissement en direct reste actif
  useEffect(() => {
    if (!preloaded) void load();
  }, [load, preloaded]);

  // Nombre de véhicules du catalogue par marque (cartes « Les grandes marques »)
  const vehicleCountsByBrand = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const vehicle of vehicles) {
      if (!vehicle.brand) continue;
      const key = normalizeBrandKey(vehicle.brand);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [vehicles]);

  // Catégories réellement présentes, proposées dans la recherche du hero
  const heroCategories = useMemo(
    () => [...new Set(vehicles.map((vehicle) => vehicle.category).filter(Boolean))] as string[],
    [vehicles]
  );

  // Extrait réel pour la section « alternatives » : catégorie la mieux fournie (plus d'agences, puis plus de véhicules)
  const catalogComparison = useMemo(() => {
    const byCategory = new Map<string, Vehicle[]>();
    for (const vehicle of vehicles) {
      if (!vehicle.category || !vehicle.daily_price) continue;
      byCategory.set(vehicle.category, [...(byCategory.get(vehicle.category) ?? []), vehicle]);
    }
    let best: { category: string; list: Vehicle[]; agencies: number } | null = null;
    for (const [category, list] of byCategory) {
      const agencies = new Set(list.map((vehicle) => vehicle.agency_id)).size;
      if (list.length < 2) continue;
      if (!best || agencies > best.agencies || (agencies === best.agencies && list.length > best.list.length)) {
        best = { category, list, agencies };
      }
    }
    if (!best) return null;
    // Moins chers d'abord, en variant les agences tant que possible
    const sorted = [...best.list].sort((a, b) => a.daily_price - b.daily_price);
    const picked: Vehicle[] = [];
    const seenAgencies = new Set<string>();
    for (const vehicle of sorted) {
      if (picked.length < 3 && !seenAgencies.has(vehicle.agency_id)) {
        picked.push(vehicle);
        seenAgencies.add(vehicle.agency_id);
      }
    }
    for (const vehicle of sorted) if (picked.length < 3 && !picked.includes(vehicle)) picked.push(vehicle);
    return { category: best.category, total: best.list.length, agencies: best.agencies, vehicles: picked };
  }, [vehicles]);

  useRealtimeRefresh({
    tables: ['vehicles', 'agencies', 'bookings'],
    onRefresh: load,
    pollingIntervalMs: 60_000,
  });

  // Voitures et motos présentées séparément
  const carVehicles = vehicles.filter((v) => !isMotorcycle(v));
  const motoVehicles = vehicles.filter((v) => isMotorcycle(v));

  // Tri : disponibles d'abord, puis prix croissant
  const byAvailabilityThenPrice = (a: Vehicle, b: Vehicle) => {
    const aAvail = a.status === 'AVAILABLE' ? 0 : 1;
    const bAvail = b.status === 'AVAILABLE' ? 0 : 1;
    if (aAvail !== bAvail) return aAvail - bAvail;
    return a.daily_price - b.daily_price;
  };
  const sortedVehicles = [...carVehicles].sort(byAvailabilityThenPrice);
  const featuredMotos = [...motoVehicles].sort(byAvailabilityThenPrice).slice(0, 3);

  // Filtre catégorie + budget (voitures)
  const featuredVehicles = sortedVehicles.filter((v) => {
    const categoryMatch =
      vehicleFilter === 'Tous'
        ? true
        : vehicleFilter === 'Automatique'
        ? v.transmission === 'AUTOMATIC'
        : vehicleFilter === '7 places'
        ? (v.seats ?? 0) >= 7
        : v.category === vehicleFilter;
    const budgetMatch = budgetMax === 0 || v.daily_price <= budgetMax;
    return categoryMatch && budgetMatch;
  });

  const featuredAgencies = agencies.slice(0, 4);

  const totalVehicles = vehicles.length;
  const totalAgencies = agencies.length;

  // ── Helpers catégories ──────────────────────────────────────────
  const getCategoryCount = (cat: string) =>
    vehicles.filter((v) => v.category === cat && v.status === 'AVAILABLE').length;
  const getCategoryMinPrice = (cat: string): number | null => {
    const prices = vehicles
      .filter((v) => v.category === cat && v.status === 'AVAILABLE')
      .map((v) => v.daily_price);
    return prices.length > 0 ? Math.min(...prices) : null;
  };
  const getTotalCategoryCount = (cat: string) =>
    vehicles.filter((v) => v.category === cat).length;

  // Types de véhicules (taxonomie officielle — cartes)
  // Ordre par popularité / volume estimé
  const CATEGORY_DEFS = [
    { name: 'Économique', image: '/economique.jpeg', description: 'Pratique & économique' },
    { name: 'SUV',        image: '/suv.jpeg',        description: 'Confort & espace' },
    { name: 'Berline',    image: '/Mercedes%20Class%20C%20220%20D.jpeg', description: 'Élégance au quotidien' },
    { name: 'Compacte',   image: '/economique.jpeg', description: 'Agile en ville' },
    { name: 'Luxe',       image: '/luxe.jpeg',       description: 'Prestige & confort' },
    { name: 'Utilitaire', image: '/voiture%207%20places.jpeg', description: 'Charges & déménagement' },
  ] as const;

  const categories = CATEGORY_DEFS.map((def) => ({
    ...def,
    availableCount: getCategoryCount(def.name),
    totalCount: getTotalCategoryCount(def.name),
    minPrice: getCategoryMinPrice(def.name),
  }));

  // Filtres pratiques (chips — cumulables avec catégorie)
  // N'apparaissent que si le catalogue contient au moins un véhicule correspondant
  const practicalFilters = [
    carVehicles.some((v) => v.transmission === 'AUTOMATIC') && { label: 'Automatique', key: 'automatic', active: vehicleFilter === 'Automatique' },
    carVehicles.some((v) => (v.seats ?? 0) >= 7) && { label: '7 places', key: '7places', active: vehicleFilter === '7 places' },
  ].filter(Boolean) as { label: string; key: string; active: boolean }[];

  // Puces de catégories : uniquement celles présentes, de la plus fournie à la moins fournie
  const categoryChips = [
    'Tous',
    ...[...new Set(carVehicles.map((v) => v.category).filter(Boolean) as string[])].sort(
      (a, b) => carVehicles.filter((v) => v.category === b).length - carVehicles.filter((v) => v.category === a).length
    ),
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
      description: `Une équipe locale joignable ${SUPPORT_HOURS_SUMMARY} pour répondre à vos questions.`,
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
          HERO — Contenu affiché dès le premier rendu (aucun fondu bloquant),
          recherche immédiatement utilisable
      ================================================================= */}
      <section className="relative isolate overflow-hidden bg-[#070B12] text-white">
        {/* Photo d'ambiance décorative : alt vide, chargée en priorité (élément LCP) */}
        <Image
          src="/hero-nador.webp"
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="-z-20 object-cover object-[70%_center]"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-[#05080D]/95 via-[#05080D]/70 to-[#05080D]/25 rtl:bg-linear-to-l" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-[#05080D] via-transparent to-transparent" />

        <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pb-16 sm:pt-14 lg:px-8 lg:pb-20 lg:pt-20">
          <h1 className="max-w-3xl text-[28px] font-black leading-[1.1] tracking-tight text-white text-crisp sm:text-5xl lg:text-[56px]">
            {t.hero.titleLead}{' '}
            <span className="text-accent-text">{t.hero.titleAccent}</span>
          </h1>

          {/* Masqué sur les petits téléphones (≤ 720 px de haut) pour garder « Rechercher » visible au chargement */}
          <p className="mt-3 max-w-2xl text-[15px] leading-6 max-sm:[@media(max-height:720px)]:hidden sm:mt-4 sm:leading-7 text-slate-300 sm:text-base">
            {t.hero.subtitle}
          </p>

          {/* Formulaire de recherche — visible et utilisable dès l'ouverture */}
          <div className="mt-5 max-w-5xl sm:mt-7">
            <SearchBar categories={heroCategories} />
          </div>

          {/* Réassurance factuelle + liens secondaires */}
          <div className="mt-5 flex max-w-5xl flex-col gap-4 text-[13px] text-slate-300 lg:flex-row lg:items-center lg:justify-between">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {[t.hero.badgeNoOnlinePayment, t.hero.badgeVerified, t.hero.badgePickup].map((label) => (
                <li key={label} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <a
                href="#comment-ca-marche"
                className="inline-flex min-h-6 items-center gap-1 font-semibold text-white/85 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                {t.hero.howItWorks}
                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
              </a>
              <Link
                href="/agency/join"
                className="inline-flex min-h-6 items-center gap-1 font-semibold text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                {t.hero.ctaAgency}
              </Link>
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
        {/* En-tête */}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="section-header-eyebrow">
              <span className="h-3 w-3 rounded-full bg-[#E63946]" />
              Explorer
            </p>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Trouvez votre style
            </h2>
            <p className="mt-2 text-sm text-slate-500 max-w-md">
              Du modèle économique au véhicule premium — choisissez le type qui correspond à votre trajet.
            </p>
          </div>
          <Link
            href="/search"
            className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#E63946]/30 hover:text-accent-text hover:shadow-md sm:flex shrink-0"
          >
            Tout explorer <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Chips filtres pratiques (cumulables avec type) */}
        {practicalFilters.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2" role="group" aria-label="Filtres pratiques">
          <span className="text-xs font-semibold text-slate-500">Aussi :</span>
          {practicalFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setVehicleFilter(f.active ? 'Tous' : f.label)}
              aria-pressed={f.active}
              className={
                f.active
                  ? 'rounded-full px-4 py-2 text-xs font-bold bg-[#0B1220] text-white shadow-sm transition min-h-11'
                  : 'rounded-full px-4 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition min-h-11'
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        )}

        {/* Grille de cartes — mobile: scroll-snap horizontal, tablette: 3 col, desktop: 6 col */}
        <div
          className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory no-scrollbar sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-6 sm:gap-4"
          role="list"
          aria-label="Catégories de véhicules"
        >
          {categories.map((category) => {
            const isSoon = category.totalCount === 0;
            const hasAvailable = category.availableCount > 0;
            const ariaLabel = isSoon
              ? `Catégorie ${category.name} — bientôt disponible`
              : `Voir les ${category.availableCount} véhicule${category.availableCount > 1 ? 's' : ''} ${category.name.toLowerCase()}`;

            if (isSoon) {
              // Carte grisée non-cliquable
              return (
                <div
                  key={category.name}
                  role="listitem"
                  aria-label={ariaLabel}
                  className="relative aspect-[0.88] w-[72vw] shrink-0 snap-start overflow-hidden rounded-2xl bg-slate-900 opacity-60 sm:w-auto cursor-not-allowed"
                >
                  <Image
                    src={category.image}
                    alt=""
                    fill
                    loading="lazy"
                    sizes="(max-width: 640px) 72vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-cover grayscale"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/50 to-black/10 pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 p-3.5">
                    <div className="text-sm font-black text-white/70">{category.name}</div>
                    <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white/50">
                      Bientôt
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={category.name}
                href={`/search?category=${encodeURIComponent(category.name)}`}
                role="listitem"
                aria-label={ariaLabel}
                className="group relative aspect-[0.88] w-[72vw] shrink-0 snap-start overflow-hidden rounded-2xl bg-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E63946] sm:w-auto"
              >
                {/* Photo */}
                <Image
                  src={category.image}
                  alt={`${category.name} — CarDrive Nador`}
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 72vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover transition-transform duration-700 ease-out motion-reduce:transition-none group-hover:scale-105"
                />

                {/* Dégradé — 60 % de hauteur, jusqu'à 85 % opacité */}
                <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/45 to-black/5 pointer-events-none" />

                {/* Barre accent bas */}
                <div className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-[#E63946] transition-transform duration-300 group-hover:scale-x-100 motion-reduce:transition-none" aria-hidden="true" />

                {/* Contenu texte */}
                <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
                  {/* Nom catégorie */}
                  <p className="text-sm font-black text-white leading-tight" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                    {category.name}
                  </p>

                  {/* Sous-titre */}
                  <p className="mt-0.5 text-[13px] font-medium text-white/80 leading-snug">
                    {category.description}
                  </p>

                  {/* Ligne bas : compteur + prix + flèche */}
                  <div className="mt-2 flex items-center justify-between gap-1">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-white/90 leading-none">
                        {hasAvailable
                          ? `${category.availableCount} véhicule${category.availableCount > 1 ? 's' : ''}`
                          : 'Indisponible'}
                      </span>
                      {category.minPrice !== null && (
                        <span className="text-[11px] font-semibold text-white/65 mt-0.5">
                          à partir de {category.minPrice.toLocaleString('fr-FR')} DH/j
                        </span>
                      )}
                    </div>
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 transition-colors duration-200 group-hover:bg-[#E63946] motion-reduce:transition-none"
                      aria-hidden="true"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5 text-white" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Lien mobile "Voir tout" */}
        <div className="mt-6 flex justify-center sm:hidden">
          <Link href="/search" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#E63946]/30 hover:text-accent-text">
            Tout explorer <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ================================================================
          FEATURED VEHICLES — Distinction nette entre erreur et absence
      ================================================================= */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* En-tête section */}
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="section-header-eyebrow">
                <span className="h-3 w-3 rounded-full bg-[#E63946]" />
                Sélection CarDrive
              </p>
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Les voitures populaires
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Consultez les caractéristiques et envoyez votre demande pour vos dates.
              </p>
            </div>
            <Link
              href="/search"
              className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#E63946]/30 hover:text-accent-text hover:shadow-md sm:flex"
            >
              Tout explorer <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* ── Barre de dates ──────────────────────────────────────────────── */}
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white shadow-xs p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <label htmlFor="date-depart" className="text-xs font-semibold text-slate-600 shrink-0 w-16">
                  Départ
                </label>
                <input
                  id="date-depart"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    const start = e.target.value;
                    const endInput = document.getElementById('date-retour') as HTMLInputElement | null;
                    const end = endInput?.value ?? '';
                    if (start && end && end > start) {
                      const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
                      setSelectedDays(diff > 0 ? diff : 0);
                    } else {
                      setSelectedDays(0);
                    }
                  }}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B1220] focus:border-transparent transition min-h-11"
                  aria-label="Date de départ"
                />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <label htmlFor="date-retour" className="text-xs font-semibold text-slate-600 shrink-0 w-16">
                  Retour
                </label>
                <input
                  id="date-retour"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    const end = e.target.value;
                    const startInput = document.getElementById('date-depart') as HTMLInputElement | null;
                    const start = startInput?.value ?? '';
                    if (start && end && end > start) {
                      const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
                      setSelectedDays(diff > 0 ? diff : 0);
                    } else {
                      setSelectedDays(0);
                    }
                  }}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B1220] focus:border-transparent transition min-h-11"
                  aria-label="Date de retour"
                />
              </div>
              {selectedDays > 0 && (
                <div className="shrink-0 rounded-xl bg-[#0B1220] px-4 py-2.5 text-sm font-bold text-white flex items-center">
                  {selectedDays} jour{selectedDays > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          {/* ── Chips filtres rapides ───────────────────────────────────────── */}
          <div className="mb-6 flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer par catégorie">
            {categoryChips.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setVehicleFilter(filter)}
                aria-pressed={vehicleFilter === filter}
                className={
                  vehicleFilter === filter
                    ? 'rounded-full px-4 py-2 text-xs font-bold bg-[#0B1220] text-white shadow-sm transition min-h-11'
                    : 'rounded-full px-4 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition min-h-11'
                }
              >
                {filter}
                {filter !== 'Tous' && (
                  <span className="ml-1.5 opacity-60">
                    ({carVehicles.filter((v) => v.category === filter).length})
                  </span>
                )}
              </button>
            ))}
            <div className="flex items-center gap-1.5 ml-auto">
              <label htmlFor="budget-max" className="text-xs font-semibold text-slate-600 shrink-0">
                Budget&nbsp;:
              </label>
              <select
                id="budget-max"
                value={budgetMax}
                onChange={(e) => setBudgetMax(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B1220] transition min-h-11 cursor-pointer"
                aria-label="Budget maximum par jour"
              >
                <option value={0}>Tous budgets</option>
                <option value={300}>≤ 300 DH/j</option>
                <option value={500}>≤ 500 DH/j</option>
                <option value={800}>≤ 800 DH/j</option>
                <option value={1200}>≤ 1 200 DH/j</option>
              </select>
            </div>
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
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredVehicles.map((vehicle, index) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  priority={index < 3}
                  selectedDays={selectedDays > 0 ? selectedDays : undefined}
                />
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-center sm:hidden">
            <Link href="/search" className="btn-primary px-5 py-3 text-sm">
              Voir toutes les voitures <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================
          MOTOS — Section distincte, affichée seulement si des motos sont publiées
      ================================================================= */}
      {dataLoaded && !hasError && featuredMotos.length > 0 && (
        <section aria-labelledby="home-motos-title" className="border-t border-slate-200 bg-[#F5F6F8] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="section-header-eyebrow">
                  <Motorbike className="h-3.5 w-3.5" aria-hidden="true" />
                  Deux-roues
                </p>
                <h2 id="home-motos-title" className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Motos et scooters
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {motoVehicles.length} moto{motoVehicles.length > 1 ? 's' : ''} proposée{motoVehicles.length > 1 ? 's' : ''} par les agences partenaires, avec cylindrée et permis exigé.
                </p>
              </div>
              <Link
                href="/motos"
                className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#E63946]/30 hover:text-accent-text hover:shadow-md sm:flex"
              >
                Toutes les motos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredMotos.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  selectedDays={selectedDays > 0 ? selectedDays : undefined}
                />
              ))}
            </div>
            <div className="mt-8 flex justify-center sm:hidden">
              <Link href="/motos" className="btn-primary px-5 py-3 text-sm">
                Voir toutes les motos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

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
                <span className="text-accent-text">{t.differentiator.titleAccent}</span>
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

            {/* Extrait réel du catalogue : même catégorie, plusieurs agences (aucune donnée fictive) */}
            <div className="relative">
              <div className="absolute -inset-6 rounded-4xl bg-[#E63946]/4 blur-2xl" aria-hidden="true" />
              <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-[#111827] shadow-2xl">
                <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Extrait du catalogue</p>
                    <p className="mt-1 truncate text-sm font-bold text-white">
                      {catalogComparison
                        ? `Catégorie ${catalogComparison.category} · ${catalogComparison.total} véhicule${catalogComparison.total > 1 ? 's' : ''}`
                        : 'Comparez les offres d’une même catégorie'}
                    </p>
                  </div>
                  {catalogComparison && (
                    <span className="shrink-0 rounded-full bg-white/8 px-2.5 py-1 text-xs font-semibold text-slate-300">
                      {catalogComparison.agencies} agence{catalogComparison.agencies > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="space-y-3 p-5 sm:p-6">
                  {!dataLoaded ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="h-16 animate-pulse rounded-xl bg-white/5 motion-reduce:animate-none" aria-hidden="true" />
                    ))
                  ) : catalogComparison ? (
                    catalogComparison.vehicles.map((vehicle) => (
                      <Link
                        key={vehicle.id}
                        href={`/cars/${vehicle.slug}`}
                        className="group flex items-center justify-between gap-4 rounded-xl border border-white/6 bg-white/3 p-3.5 transition-colors hover:border-white/15 hover:bg-white/6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E63946]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">
                            {vehicle.brand} {vehicle.model} <span className="font-medium text-slate-400">{vehicle.year}</span>
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {vehicle.agency?.name ?? 'Agence partenaire'} ·{' '}
                            {vehicle.status === 'AVAILABLE' ? 'Disponible' : 'En location actuellement'}
                          </p>
                        </div>
                        <div className="shrink-0 text-end">
                          <p className="text-sm font-black text-white tabular-nums">{vehicle.daily_price.toLocaleString('fr-FR')} DH</p>
                          <p className="text-xs text-slate-400">par jour</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="rounded-xl border border-white/6 bg-white/3 p-4 text-sm text-slate-300">
                      Le catalogue s’enrichit : les offres de plusieurs agences pour une même catégorie apparaîtront ici.
                    </p>
                  )}

                  <Link
                    href={catalogComparison ? `/search?category=${encodeURIComponent(catalogComparison.category)}` : '/search'}
                    className="inline-flex min-h-10 items-center gap-1.5 pt-1 text-sm font-semibold text-slate-200 transition-colors hover:text-white"
                  >
                    Comparer toute la catégorie
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                  </Link>
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
                    <span className="badge badge-accent text-[11px]">{destination.tag}</span>
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
                            ? 'bg-[#0B1220] text-white group-hover:bg-action'
                            : 'bg-[#0B1220] text-white group-hover:bg-action'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-mono text-3xl font-black tracking-tight text-slate-500 transition group-hover:text-accent-text">
                        {step.number}
                      </span>
                    </div>

                    <div className="mt-6 flex items-center gap-2">
                      <span className="inline-flex rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                        Étape {index + 1}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
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
              className="inline-flex items-center gap-2 rounded-xl bg-action px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-950/15 transition hover:bg-action-hover"
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
              <FileText className="h-4 w-4 text-accent-text" />
              <h3 className="text-sm font-bold text-slate-900">Conditions et transparence</h3>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">À savoir avant votre demande</span>
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
          <Link href="/agencies" className="hidden items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-accent-text sm:flex">
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
                <Link href="/search" className="inline-flex items-center gap-2 rounded-xl bg-action px-4 py-2.5 text-xs font-bold text-white transition hover:bg-action-hover">
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
                <Building2 className="h-3.5 w-3.5 text-accent-text" />
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

      {/* Carrousel des grandes marques — dernière section, juste avant le footer */}
      <BrandMarquee vehicleCounts={vehicleCountsByBrand} countsLoading={!dataLoaded} />
    </div>
  );
}
