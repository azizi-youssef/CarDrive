
'use client';

import React, { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { store } from '@/lib/services/store';
import { findSameModelAlternatives } from '@/lib/availability/engine';
import { BookingCard } from '@/components/booking/BookingCard';
import { generateWhatsAppLink, formatPrice } from '@/lib/utils';
import { SameModelAlternatives } from '@/components/cars/SameModelAlternatives';
import { Badge } from '@/components/ui/Badge';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import {
  Users,
  Fuel,
  Gauge,
  DoorOpen,
  ShieldCheck,
  Check,
  Star,
  MapPin,
  Building2,
  ChevronRight,
  MessageCircle,
  CalendarDays,
  LockKeyhole,
  CarFront,
  CircleCheck,
  Info,
  ArrowRight,
  Heart,
  Share2,
  Sparkles,
  BadgeCheck,
} from 'lucide-react';

interface CarDetailsPageProps {
  params: Promise<{ slug: string }>;
}

export default function CarDetailsPage({
  params,
}: CarDetailsPageProps) {
  const resolvedParams = use(params);

  const vehicle = store.getVehicleBySlug(resolvedParams.slug);

  if (!vehicle) {
    notFound();
  }

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [favorite, setFavorite] = useState(false);

  const alternatives = findSameModelAlternatives({
    currentVehicle: vehicle,
    allVehicles: store.getVehicles(),
    allBookings: store.getBookings(),
  });

  const reviews = store.getReviewsForVehicle(vehicle.id);

  const images =
    vehicle.images && vehicle.images.length > 0
      ? vehicle.images
      : [
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1400&auto=format&fit=crop&q=85',
      ];

  const isAvailable = vehicle.status === 'AVAILABLE';

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) /
      reviews.length
      : vehicle.agency?.rating ?? 0;

  const whatsappLink = generateWhatsAppLink({
    phone: vehicle.agency?.whatsapp || '+212661234567',
    vehicleName: `${vehicle.brand} ${vehicle.model}`,
    agencyName: vehicle.agency?.name || "l'agence",
    startDate: new Date().toLocaleDateString('fr-FR'),
    endDate: new Date(
      Date.now() + 3 * 86400000
    ).toLocaleDateString('fr-FR'),
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 lg:pb-16">

      {/* ================================================================ */}
      {/* BREADCRUMB                                                       */}
      {/* ================================================================ */}

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <nav
            aria-label="Fil d'Ariane"
            className="flex h-11 items-center gap-1.5 overflow-hidden text-[11px] font-medium text-slate-500"
          >
            <Link
              href="/"
              className="shrink-0 transition-colors hover:text-slate-900"
            >
              Accueil
            </Link>

            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />

            <Link
              href="/search"
              className="shrink-0 transition-colors hover:text-slate-900"
            >
              Véhicules
            </Link>

            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />

            <span className="truncate font-semibold text-slate-900">
              {vehicle.brand} {vehicle.model}
            </span>
          </nav>

        </div>
      </div>

      {/* ================================================================ */}
      {/* MAIN                                                              */}
      {/* ================================================================ */}

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pt-8">

        {/* ============================================================ */}
        {/* VEHICLE HEADER                                               */}
        {/* ============================================================ */}

        <section className="mb-6">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div className="min-w-0">

              {/* Badges */}
              <div className="mb-3 flex flex-wrap items-center gap-2">

                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600 shadow-sm">
                  {vehicle.category}
                </span>

                <Badge
                  variant={
                    isAvailable
                      ? 'available'
                      : 'rented'
                  }
                  icon
                >
                  {isAvailable
                    ? 'Disponible'
                    : 'Actuellement loué'}
                </Badge>

                {isAvailable && (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700">
                    <CircleCheck className="h-3 w-3" />
                    Réservation possible
                  </span>
                )}

              </div>

              {/* Title */}
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl lg:text-[38px]">
                {vehicle.brand} {vehicle.model}
                <span className="ml-2 font-medium text-slate-400">
                  {vehicle.year}
                </span>
              </h1>

              {/* Agency */}
              {vehicle.agency && (
                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-slate-500">

                  <span>
                    Proposé par
                  </span>

                  <Link
                    href={`/agencies/${vehicle.agency.slug}`}
                    className="group inline-flex items-center gap-1.5 font-bold text-slate-900 transition-colors hover:text-[#E63946]"
                  >
                    <Building2 className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#E63946]" />
                    {vehicle.agency.name}
                  </Link>

                  {vehicle.agency.verified && (
                    <Badge
                      variant="verified"
                      icon
                    >
                      Vérifiée
                    </Badge>
                  )}

                  <span className="text-slate-300">
                    •
                  </span>

                  <span className="flex items-center gap-1 font-bold text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {averageRating > 0
                      ? averageRating.toFixed(1)
                      : 'Nouveau'}
                  </span>

                  {reviews.length > 0 && (
                    <span className="text-slate-400">
                      ({reviews.length} avis)
                    </span>
                  )}

                </div>
              )}
            </div>

            {/* Desktop actions */}
            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={() =>
                  setFavorite((current) => !current)
                }
                aria-label={
                  favorite
                    ? 'Retirer des favoris'
                    : 'Ajouter aux favoris'
                }
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${favorite
                    ? 'border-red-200 bg-red-50 text-[#E63946]'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900'
                  }`}
              >
                <Heart
                  className={`h-4 w-4 ${favorite
                      ? 'fill-current'
                      : ''
                    }`}
                />
              </button>

              <button
                type="button"
                aria-label="Partager ce véhicule"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900"
              >
                <Share2 className="h-4 w-4" />
              </button>

            </div>

          </div>
        </section>

        {/* ================================================================ */}
        {/* HERO / GALLERY + BOOKING                                        */}
        {/* ================================================================ */}

        <div className="grid items-start gap-8 lg:grid-cols-12">

          {/* ============================================================ */}
          {/* LEFT CONTENT                                                 */}
          {/* ============================================================ */}

          <div className="space-y-7 lg:col-span-8">

            {/* ---------------------------------------------------------- */}
            {/* GALLERY                                                     */}
            {/* ---------------------------------------------------------- */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">

              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-slate-100">

                <Image
                  src={images[activeImageIndex]}
                  alt={`${vehicle.brand} ${vehicle.model} — photo ${activeImageIndex + 1}`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover"
                />

                {/* Gradient */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent" />

                {/* Image counter */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/50 px-2.5 py-1.5 text-[10px] font-semibold text-white backdrop-blur-md">
                  <CarFront className="h-3 w-3" />
                  {activeImageIndex + 1} / {images.length}
                </div>

                {/* Availability */}
                {isAvailable && (
                  <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1.5 text-[9px] font-bold text-emerald-700 shadow-sm backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Disponible
                  </div>
                )}

              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="mt-2.5 grid grid-cols-4 gap-2 sm:grid-cols-5">

                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() =>
                        setActiveImageIndex(index)
                      }
                      aria-label={`Afficher la photo ${index + 1}`}
                      className={`relative aspect-[16/10] overflow-hidden rounded-lg border-2 transition-all duration-200 ${activeImageIndex === index
                          ? 'border-[#E63946] ring-2 ring-[#E63946]/10'
                          : 'border-transparent opacity-65 hover:opacity-100'
                        }`}
                    >
                      <Image
                        src={image}
                        alt=""
                        fill
                        sizes="140px"
                        className="object-cover"
                      />
                    </button>
                  ))}

                </div>
              )}

            </section>

            {/* ---------------------------------------------------------- */}
            {/* QUICK TRUST STRIP                                           */}
            {/* ---------------------------------------------------------- */}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-[10px] font-semibold text-slate-600">
                  Agence vérifiée
                </span>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3">
                <LockKeyhole className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="text-[10px] font-semibold text-slate-600">
                  Réservation sécurisée
                </span>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3">
                <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="text-[10px] font-semibold text-slate-600">
                  Disponibilité
                </span>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3">
                <MessageCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-[10px] font-semibold text-slate-600">
                  Contact direct
                </span>
              </div>

            </div>

            {/* ---------------------------------------------------------- */}
            {/* SPECS                                                       */}
            {/* ---------------------------------------------------------- */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Informations
                  </p>

                  <h2 className="mt-1 text-base font-bold text-slate-950">
                    Caractéristiques du véhicule
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">

                <SpecCard
                  icon={<Gauge />}
                  label="Transmission"
                  value={
                    vehicle.transmission === 'AUTOMATIC'
                      ? 'Automatique'
                      : 'Manuelle'
                  }
                />

                <SpecCard
                  icon={<Fuel />}
                  label="Carburant"
                  value={
                    vehicle.fuel === 'DIESEL'
                      ? 'Diesel'
                      : vehicle.fuel === 'GASOLINE'
                        ? 'Essence'
                        : 'Hybride'
                  }
                />

                <SpecCard
                  icon={<Users />}
                  label="Passagers"
                  value={`${vehicle.seats} places`}
                />

                <SpecCard
                  icon={<DoorOpen />}
                  label="Portes"
                  value={`${vehicle.doors} portes`}
                />

              </div>

            </section>

            {/* ---------------------------------------------------------- */}
            {/* FEATURES                                                     */}
            {/* ---------------------------------------------------------- */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Inclus
                </p>

                <h2 className="mt-1 text-base font-bold text-slate-950">
                  Équipements & options
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                {vehicle.features.map((feature, index) => (
                  <FeatureItem
                    key={`${feature}-${index}`}
                    label={feature}
                  />
                ))}

                <FeatureItem
                  label="Kilométrage illimité à partir de 3 jours"
                />

                <FeatureItem
                  label="Assurance collision & tiers incluse"
                />

              </div>

            </section>

            {/* ---------------------------------------------------------- */}
            {/* RENTAL CONDITIONS                                            */}
            {/* ---------------------------------------------------------- */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="mb-5 flex items-start gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                  <Info className="h-4 w-4 text-slate-600" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-950">
                    Conditions de location
                  </h2>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Les conditions peuvent varier selon l'agence.
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                <ConditionCard
                  label="Caution"
                  value={`${vehicle.deposit} DH`}
                  description="Selon les conditions de l'agence."
                />

                <ConditionCard
                  label="Âge minimum"
                  value="21 ans"
                  description="Permis valide depuis plus de 2 ans."
                />

                <ConditionCard
                  label="Livraison locale"
                  value="Disponible"
                  description="Selon le point de prise en charge."
                />

              </div>

            </section>

            {/* ---------------------------------------------------------- */}
            {/* ALTERNATIVES                                                */}
            {/* ---------------------------------------------------------- */}

            <SameModelAlternatives
              currentVehicle={vehicle}
              alternatives={alternatives}
            />

            {/* ---------------------------------------------------------- */}
            {/* REVIEWS                                                      */}
            {/* ---------------------------------------------------------- */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Expérience client
                  </p>

                  <h2 className="mt-1 text-base font-bold text-slate-950">
                    Avis clients
                    {reviews.length > 0 && (
                      <span className="ml-1 text-slate-400">
                        ({reviews.length})
                      </span>
                    )}
                  </h2>
                </div>

                <div className="flex items-center gap-2">

                  <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700">
                    <Star className="h-3.5 w-3.5 fill-current" />

                    {averageRating > 0
                      ? averageRating.toFixed(1)
                      : '—'}
                  </div>

                  {reviews.length > 0 && (
                    <span className="text-[10px] text-slate-400">
                      sur 5
                    </span>
                  )}

                </div>

              </div>

              {reviews.length > 0 ? (
                <div className="divide-y divide-slate-100">

                  {reviews.map((review) => (
                    <article
                      key={review.id}
                      className="py-4 first:pt-5 last:pb-0"
                    >
                      <div className="flex items-center justify-between gap-4">

                        <div className="flex items-center gap-2">

                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                            {review.author_name
                              .slice(0, 1)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {review.author_name}
                            </p>

                            <div className="mt-0.5 flex items-center gap-1 text-amber-500">
                              {Array.from({
                                length: review.rating,
                              }).map((_, index) => (
                                <Star
                                  key={index}
                                  className="h-3 w-3 fill-current"
                                />
                              ))}
                            </div>
                          </div>

                        </div>

                        <Badge
                          variant="verified"
                          icon
                        >
                          Vérifié
                        </Badge>

                      </div>

                      <p className="mt-3 text-xs leading-6 text-slate-600">
                        {review.comment}
                      </p>
                    </article>
                  ))}

                </div>
              ) : (
                <div className="py-8 text-center">

                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                    <MessageCircle className="h-4 w-4 text-slate-400" />
                  </div>

                  <p className="mt-3 text-xs font-semibold text-slate-700">
                    Aucun avis pour ce véhicule
                  </p>

                  <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-slate-500">
                    Les avis liés à ce véhicule apparaîtront ici après
                    les premières locations.
                  </p>

                </div>
              )}

            </section>

          </div>

          {/* ============================================================ */}
          {/* BOOKING SIDEBAR                                              */}
          {/* ============================================================ */}

          <aside className="lg:col-span-4">

            <div className="lg:sticky lg:top-24">

              <BookingCard vehicle={vehicle} />

              {/* Direct contact */}
              {vehicle.agency && (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                      <MessageCircle className="h-4 w-4 text-emerald-600" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900">
                        Une question ?
                      </p>

                      <p className="mt-0.5 truncate text-[10px] text-slate-500">
                        Contactez directement l'agence.
                      </p>
                    </div>

                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white transition-colors hover:bg-emerald-700"
                    >
                      WhatsApp
                    </a>

                  </div>

                </div>
              )}

              {/* Security note */}
              <div className="mt-3 flex gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">

                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />

                <p className="text-[10px] leading-relaxed text-slate-500">
                  Vérifiez toujours les conditions finales,
                  la caution et les documents requis directement
                  avec l'agence avant la prise du véhicule.
                </p>

              </div>

            </div>

          </aside>

        </div>

      </div>

      {/* ================================================================ */}
      {/* MOBILE STICKY BOOKING BAR                                       */}
      {/* ================================================================ */}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:hidden">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">

          <div className="min-w-0">

            <p className="truncate text-[10px] font-semibold text-slate-500">
              {vehicle.brand} {vehicle.model}
            </p>

            <div className="flex items-baseline gap-1">

              <span className="text-base font-extrabold text-slate-950">
                {formatPrice(vehicle.daily_price)}
              </span>

              <span className="text-[10px] text-slate-400">
                / jour
              </span>

            </div>

          </div>

          <div className="flex shrink-0 items-center gap-2">

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contacter par WhatsApp"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" />
            </a>

            <a
              href="#booking-form"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#E63946] px-4 text-xs font-bold text-white shadow-sm shadow-red-900/10 transition-all hover:bg-[#C92F3B]"
            >
              Réserver
              <ArrowRight className="h-3 w-3" />
            </a>

          </div>

        </div>

      </div>

    </div>
  );
}

/* ====================================================================== */
/* SMALL UI COMPONENTS                                                    */
/* ====================================================================== */

function SpecCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 transition-colors hover:border-slate-200 hover:bg-white">

      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#E63946] shadow-sm">
        {React.cloneElement(
          icon as React.ReactElement<{ className?: string }>,
          {
            className: 'h-4 w-4',
          }
        )}
      </div>

      <span className="block text-[10px] font-medium text-slate-400">
        {label}
      </span>

      <strong className="mt-0.5 block text-xs font-bold text-slate-800">
        {value}
      </strong>

    </div>
  );
}

function FeatureItem({
  label,
}: {
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">

      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <Check className="h-3 w-3" />
      </span>

      <span className="text-xs text-slate-700">
        {label}
      </span>

    </div>
  );
}

function ConditionCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">

      <span className="block text-[10px] font-medium text-slate-400">
        {label}
      </span>

      <strong className="mt-1 block text-sm font-bold text-slate-900">
        {value}
      </strong>

      <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
        {description}
      </p>

    </div>
  );
}
