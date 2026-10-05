'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SearchBar } from '@/components/search/SearchBar';
import { VehicleCard } from '@/components/cars/VehicleCard';
import { AgencyCard } from '@/components/agencies/AgencyCard';
import { store } from '@/lib/services/store';

import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  MessageCircle,
  Plane,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  const vehicles = store.getVehicles();
  const agencies = store.getAgencies();

  const featuredVehicles = vehicles.slice(0, 6);
  const featuredAgencies = agencies.slice(0, 4);

  const totalVehicles = vehicles.length;
  const totalAgencies = agencies.length;

  const averageRating =
    agencies.length > 0
      ? (
        agencies.reduce(
          (sum, agency) => sum + (typeof agency.rating === 'number' ? agency.rating : 0),
          0
        ) / agencies.length
      ).toFixed(1)
      : '4.9';

  const categories = [
    {
      name: 'Économique',
      count: 18,
      image:
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=900&q=85&auto=format&fit=crop',
      description: 'Pratique & économique',
    },
    {
      name: 'SUV',
      count: 14,
      image:
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=900&q=85&auto=format&fit=crop',
      description: 'Confort & aventure',
    },
    {
      name: 'Berline',
      count: 8,
      image:
        'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=900&q=85&auto=format&fit=crop',
      description: 'Élégance au quotidien',
    },
    {
      name: 'Luxe',
      count: 6,
      image:
        'https://images.unsplash.com/photo-1563720223185-11003d516935?w=900&q=85&auto=format&fit=crop',
      description: 'Premium & prestige',
    },
    {
      name: 'Automatique',
      count: 16,
      image:
        'https://images.unsplash.com/photo-1493238792000-8113da705763?w=900&q=85&auto=format&fit=crop',
      description: 'Conduite sans effort',
    },
    {
      name: '7 places',
      count: 5,
      image:
        'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=900&q=85&auto=format&fit=crop',
      description: 'Famille & groupes',
    },
  ];

  const destinations = [
    {
      name: 'Aéroport Nador-Al Aroui',
      shortName: 'Aéroport',
      image:
        'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1000&q=85&auto=format&fit=crop',
      icon: Plane,
    },
    {
      name: 'Nador Centre',
      shortName: 'Nador',
      image:
        'https://images.unsplash.com/photo-1470214304380-aadaedcfff1b?w=1000&q=85&auto=format&fit=crop',
      icon: MapPin,
    },
    {
      name: 'Port Beni Ansar',
      shortName: 'Beni Ansar',
      image:
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=85&auto=format&fit=crop',
      icon: MapPin,
    },
    {
      name: 'Marchica & alentours',
      shortName: 'Marchica',
      image:
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1000&q=85&auto=format&fit=crop',
      icon: MapPin,
    },
  ];

  const trustItems = [
    {
      icon: ShieldCheck,
      title: 'Partenaires vérifiés',
      description: 'Des agences locales contrôlées par CarDrive.',
    },
    {
      icon: Zap,
      title: 'Réponse rapide',
      description: 'Recevez rapidement une confirmation de disponibilité.',
    },
    {
      icon: MapPin,
      title: 'Livraison flexible',
      description: 'Aéroport, port, hôtel ou adresse à Nador.',
    },
    {
      icon: MessageCircle,
      title: 'Contact direct',
      description: 'Échangez directement avec votre agence.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Recherchez',
      description:
        'Choisissez votre destination, vos dates et le type de voiture dont vous avez besoin.',
      icon: Search,
    },
    {
      number: '02',
      title: 'Comparez',
      description:
        'Comparez les véhicules, prix, équipements, agences et conditions en un seul endroit.',
      icon: Sparkles,
    },
    {
      number: '03',
      title: 'Réservez',
      description:
        'Envoyez votre demande et échangez directement avec l’agence pour finaliser.',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* ================================================================
          HERO
      ================================================================= */}
      <section className="relative min-h-[720px] overflow-hidden bg-[#070B12] text-white lg:min-h-[760px]">
        {/* Background */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=2200&q=90&auto=format&fit=crop"
            alt="Voiture premium CarDrive"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />

          <div className="absolute inset-0 bg-[#05080D]/65" />

          <div className="absolute inset-0 bg-gradient-to-r from-[#05080D]/95 via-[#05080D]/65 to-[#05080D]/35" />

          <div className="absolute inset-0 bg-gradient-to-t from-[#05080D] via-transparent to-[#05080D]/40" />

          {/* Decorative glow */}
          <div className="absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-[#E63946]/10 blur-[120px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto flex min-h-[720px] max-w-7xl flex-col justify-center px-4 pb-16 pt-28 sm:px-6 lg:min-h-[760px] lg:px-8">
          <div className="max-w-4xl">
            {/* Eyebrow */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white/90 backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
              <span>Location de voitures à Nador</span>
              <ChevronRight className="h-3.5 w-3.5 text-white/50" />
            </div>

            {/* Heading */}
            <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl xl:text-[82px]">
              Votre voiture.
              <br />
              <span className="text-white/55">Votre liberté.</span>
              <br />
              <span className="text-[#E63946]">À Nador.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Comparez les voitures disponibles auprès des agences locales et
              trouvez simplement le véhicule adapté à votre voyage.
            </p>

            {/* Search */}
            <div className="relative z-20 mt-9 max-w-5xl">
              <div className="rounded-3xl border border-white/15 bg-white/95 p-2 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-3">
                <SearchBar />
              </div>

              {/* Quick Brand Search Tags */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-white/60 font-medium">Rechercher par marque :</span>
                {['Dacia', 'Renault', 'Volkswagen', 'Hyundai', 'Mercedes-Benz', 'Peugeot'].map((brand) => (
                  <Link
                    key={brand}
                    href={`/search?brand=${encodeURIComponent(brand)}`}
                    className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/90 border border-white/15 transition-all text-xs font-semibold backdrop-blur-sm hover:scale-105"
                  >
                    {brand}
                  </Link>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{totalVehicles}+</span>
                <span className="text-slate-400">véhicules</span>
              </div>

              <div className="h-4 w-px bg-white/20" />

              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{totalAgencies}+</span>
                <span className="text-slate-400">agences</span>
              </div>

              <div className="h-4 w-px bg-white/20" />

              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-white">
                  {averageRating}
                </span>
                <span className="text-slate-400">note moyenne</span>
              </div>

              <div className="h-4 w-px bg-white/20" />

              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                <span className="text-slate-300">Contact direct</span>
              </div>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40 md:flex">
            <span className="h-6 w-px bg-white/30" />
            Découvrir
          </div>
        </div>
      </section>

      {/* ================================================================
          TRUST STRIP
      ================================================================= */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-slate-200 sm:grid-cols-4">
          {trustItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="group flex items-center gap-3 px-4 py-5 sm:px-6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 transition-colors duration-300 group-hover:bg-[#0B1220]">
                  <Icon className="h-5 w-5 text-slate-700 transition-colors group-hover:text-white" />
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-900 sm:text-sm">
                    {item.title}
                  </p>
                  <p className="mt-0.5 hidden text-[11px] leading-4 text-slate-500 sm:block">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================================================================
          CATEGORIES
      ================================================================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-9 flex items-end justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#E63946]">
              Explorer
            </p>

            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Trouvez votre style
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Du véhicule économique au modèle premium.
            </p>
          </div>

          <Link
            href="/search"
            className="hidden items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-slate-950 sm:flex"
          >
            Voir tous les véhicules
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/search?category=${encodeURIComponent(category.name)}`}
              className="group relative aspect-[0.9] overflow-hidden rounded-2xl bg-slate-900"
            >
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover transition duration-700 group-hover:scale-110"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="mb-1 text-sm font-bold text-white">
                  {category.name}
                </div>

                <div className="text-[10px] text-white/65">
                  {category.description}
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-white/60">
                    {category.count} véhicules
                  </span>

                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition group-hover:bg-[#E63946]">
                    <ArrowUpRight className="h-3.5 w-3.5 text-white" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ================================================================
          FEATURED VEHICLES
      ================================================================= */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-9 flex items-end justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Disponible maintenant
                </span>
              </div>

              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Les véhicules populaires
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Des voitures sélectionnées parmi les offres disponibles à
                Nador.
              </p>
            </div>

            <Link
              href="/search"
              className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:flex"
            >
              Tout explorer
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredVehicles.map((vehicle, index) => (
              <div
                key={vehicle.id}
                className="group transition duration-300 hover:-translate-y-1"
              >
                <VehicleCard
                  vehicle={vehicle}
                  priority={index < 3}
                />
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center sm:hidden">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B1220] px-5 py-3 text-sm font-bold text-white"
            >
              Voir tous les véhicules
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================
          CARDRIVE DIFFERENTIATOR
      ================================================================= */}
      <section className="relative overflow-hidden bg-[#080D16] py-20 text-white sm:py-28">
        <div className="absolute -left-40 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-[#E63946]/10 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
            {/* Copy */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E63946]/25 bg-[#E63946]/10 px-3 py-1.5 text-xs font-bold text-[#FF6B75]">
                <Sparkles className="h-3.5 w-3.5" />
                Une recherche plus intelligente
              </div>

              <h2 className="max-w-xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
                Une voiture n'est pas disponible ?
                <br />
                <span className="text-[#E63946]">
                  Trouvez une alternative.
                </span>
              </h2>

              <p className="mt-6 max-w-xl text-base leading-7 text-slate-400">
                Avec CarDrive, vous n'avez plus besoin de contacter plusieurs
                agences une par une. Comparez les alternatives disponibles
                auprès de différents partenaires.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  'Recherche centralisée',
                  'Alternatives entre plusieurs agences',
                  'Prix et informations comparables',
                  'Contact direct avec le partenaire',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15">
                      <Check className="h-3 w-3 text-emerald-400" />
                    </span>

                    <span className="text-sm font-medium text-slate-300">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href="/search"
                className="mt-9 inline-flex items-center gap-2 rounded-xl bg-[#E63946] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-950/40 transition hover:bg-[#C92F3B] hover:shadow-xl"
              >
                Rechercher une voiture
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Simulation */}
            <div className="relative">
              <div className="absolute -inset-5 rounded-[2rem] bg-[#E63946]/5 blur-2xl" />

              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111827] shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      CarDrive Search
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-300">
                      Résultats intelligents
                    </p>
                  </div>

                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                </div>

                <div className="space-y-4 p-5 sm:p-6">
                  {/* Requested vehicle */}
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-white">
                          Dacia Duster 2025
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Diesel · Automatique · 5 places
                        </p>
                      </div>

                      <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-400">
                        Indisponible
                      </span>
                    </div>
                  </div>

                  {/* Alternative */}
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <Sparkles className="h-4 w-4" />
                    3 alternatives trouvées
                  </div>

                  {[
                    {
                      agency: 'Rif Car Luxury',
                      car: 'Duster 2024 Diesel',
                      price: '340 DH',
                    },
                    {
                      agency: 'Marchica Drive',
                      car: 'Duster 2025 Auto',
                      price: '380 DH',
                    },
                    {
                      agency: 'Nador Cars',
                      car: 'Duster 2024',
                      price: '330 DH',
                    },
                  ].map((alternative, index) => (
                    <div
                      key={alternative.agency}
                      className="group flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.03] p-3.5 transition hover:border-emerald-500/20 hover:bg-white/[0.05]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-slate-400">
                          {String(index + 1).padStart(2, '0')}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-white">
                            {alternative.agency}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-slate-500">
                            {alternative.car}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-xs font-bold text-white">
                          {alternative.price}
                        </p>
                        <p className="text-[9px] text-slate-600">/ jour</p>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <Clock3 className="h-3.5 w-3.5" />
                      Résultats mis à jour
                    </div>

                    <span className="text-[10px] font-bold text-emerald-400">
                      Disponible
                    </span>
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
        <div className="mb-9">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#E63946]">
            Où récupérer votre voiture ?
          </p>

          <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Louez là où votre voyage commence
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Livraison et récupération dans les principaux points de Nador.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {destinations.map((destination) => {
            const Icon = destination.icon;

            return (
              <Link
                href={`/search?location=${encodeURIComponent(
                  destination.shortName
                )}`}
                key={destination.name}
                className="group relative aspect-[1.25] overflow-hidden rounded-2xl bg-slate-900"
              >
                <Image
                  src={destination.image}
                  alt={destination.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
                    <Icon className="h-4 w-4 text-white" />
                  </div>

                  <p className="text-sm font-bold text-white sm:text-base">
                    {destination.name}
                  </p>

                  <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-white/60">
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
          HOW IT WORKS
      ================================================================= */}
      <section className="border-y border-slate-200 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#E63946]">
              Simple par conception
            </p>

            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Louer une voiture, simplement
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Une expérience pensée pour aller de la recherche à la réservation
              sans complication.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div key={step.number} className="relative">
                  {index < steps.length - 1 && (
                    <div className="absolute left-[calc(100%-8px)] top-10 hidden h-px w-16 bg-slate-200 lg:block" />
                  )}

                  <div className="group rounded-3xl border border-slate-200 bg-[#F8FAFC] p-7 transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B1220] text-white shadow-lg">
                        <Icon className="h-5 w-5" />
                      </div>

                      <span className="text-4xl font-black tracking-tight text-slate-200 transition group-hover:text-slate-300">
                        {step.number}
                      </span>
                    </div>

                    <h3 className="mt-7 text-xl font-black text-slate-950">
                      {step.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================
          AGENCIES
      ================================================================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-9 flex items-end justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#E63946]">
              Nos partenaires
            </p>

            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Des agences locales
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Découvrez les professionnels présents sur CarDrive.
            </p>
          </div>

          <Link
            href="/agencies"
            className="hidden items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-slate-950 sm:flex"
          >
            Toutes les agences
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {featuredAgencies.map((agency) => (
            <div
              key={agency.id}
              className="transition duration-300 hover:-translate-y-1"
            >
              <AgencyCard
                agency={agency}
                carCount={store.getVehicles({ agencyId: agency.id }).length}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================
          B2B CTA
      ================================================================= */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#0B1220] px-6 py-12 text-white sm:px-10 sm:py-14 lg:px-14">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#E63946]/15 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />

          <div className="relative z-10 flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300">
                <Building2 className="h-3.5 w-3.5 text-[#E63946]" />
                CarDrive pour les professionnels
              </div>

              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Vous êtes une agence de location ?
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                Présentez votre flotte, recevez des demandes de réservation et
                développez votre visibilité auprès des voyageurs à Nador.
              </p>

              <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Gestion de flotte
                </span>

                <span className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Réservations
                </span>

                <span className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Visibilité locale
                </span>
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/agency/join"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E63946] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-950/30 transition hover:bg-[#C92F3B] hover:shadow-xl"
              >
                Rejoindre CarDrive
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/agency/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          MOBILE CTA
      ================================================================= */}
      <div className="fixed inset-x-4 bottom-4 z-50 md:hidden">
        <Link
          href="/search"
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#E63946] px-5 py-4 text-sm font-black text-white shadow-[0_15px_40px_rgba(230,57,70,0.35)]"
        >
          <Search className="h-4 w-4" />
          Rechercher une voiture
        </Link>
      </div>
    </div>
  );
}

