'use client';

import React, { memo, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Gauge,
  Users,
  Fuel,
  ShieldCheck,
  Star,
  Heart,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  BellRing,
  CalendarClock,
  CarFront,
} from 'lucide-react';
import type { Vehicle } from '@/types';
import { cn, formatNumber } from '@/lib/utils';
import { AgencyLogo } from '@/components/agencies/AgencyLogo';
import { isOptimizableImage } from '@/lib/utils/images';

interface VehicleCardProps {
  vehicle: Vehicle;
  priority?: boolean;
  availabilityChecked?: boolean;
  onFavorite?: (id: string) => void;
  isFavorite?: boolean;
  /** Nombre de jours sélectionnés dans la barre de dates (pour afficher le prix total) */
  selectedDays?: number;
  /** Abonnement « me prévenir » pour un véhicule indisponible (bouton masqué si absent) */
  onNotify?: (vehicleId: string) => void;
}

const MIN_REVIEWS_FOR_RATING = 5;

const STATUS_STYLES = {
  available: { label: 'Disponible', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  reserved: { label: 'Réservé', text: 'text-amber-700', dot: 'bg-amber-500' },
  rented: { label: 'En location', text: 'text-sky-700', dot: 'bg-sky-500' },
  maintenance: { label: 'Maintenance', text: 'text-slate-600', dot: 'bg-slate-400' },
  unknown: { label: 'Indisponible', text: 'text-slate-600', dot: 'bg-slate-400' },
} as const;

function resolveStatus(rawStatus?: string, checked?: boolean) {
  // Avec des dates, l'API ne renvoie que les véhicules libres sur toute la période
  if (checked) {
    return { isBookable: true, style: { ...STATUS_STYLES.available, label: 'Libre à vos dates' } };
  }
  switch (rawStatus) {
    case 'AVAILABLE':
      return { isBookable: true, style: { ...STATUS_STYLES.available, label: 'Disponible aujourd’hui' } };
    case 'RESERVED':
      return { isBookable: false, style: STATUS_STYLES.reserved };
    case 'RENTED':
      return { isBookable: false, style: STATUS_STYLES.rented };
    case 'MAINTENANCE':
      return { isBookable: false, style: STATUS_STYLES.maintenance };
    default:
      return { isBookable: false, style: STATUS_STYLES.unknown };
  }
}

const FUEL_LABELS: Record<string, string> = {
  DIESEL: 'Diesel',
  GASOLINE: 'Essence',
  HYBRID: 'Hybride',
  ELECTRIC: 'Électrique',
};

function getFuelLabel(fuel: Vehicle['fuel']): string {
  return FUEL_LABELS[fuel] ?? fuel;
}

function formatMad(value: number): string {
  return `${formatNumber(value)} MAD`;
}

export function VehicleCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white animate-pulse motion-reduce:animate-none"
    >
      <div className="aspect-[16/10] bg-slate-100" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-20 rounded bg-slate-100" />
        <div className="h-5 w-40 rounded bg-slate-100" />
        <div className="flex gap-3">
          <div className="h-4 w-16 rounded bg-slate-100" />
          <div className="h-4 w-14 rounded bg-slate-100" />
          <div className="h-4 w-12 rounded bg-slate-100" />
        </div>
        <div className="h-8 w-full rounded-lg bg-slate-100" />
        <div className="flex items-end justify-between pt-1">
          <div className="h-7 w-28 rounded bg-slate-100" />
        </div>
        <div className="h-11 w-full rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

const ARROW_BASE =
  'absolute top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur-sm transition-opacity duration-150 hover:bg-white ' +
  'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1220]';

function VehicleGallery({
  images,
  brand,
  model,
  agencyCity,
  priority,
  unavailable,
}: {
  images: string[];
  brand: string;
  model: string;
  agencyCity?: string;
  priority: boolean;
  unavailable: boolean;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedIndexes, setFailedIndexes] = useState<Set<number>>(() => new Set());

  const imagesKey = images.join('|');
  const [prevImagesKey, setPrevImagesKey] = useState(imagesKey);
  if (prevImagesKey !== imagesKey) {
    setPrevImagesKey(imagesKey);
    setCurrentIndex(0);
    setFailedIndexes(new Set());
  }

  const goTo = useCallback(
    (dir: 1 | -1, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((prev) => (prev + dir + images.length) % images.length);
    },
    [images.length]
  );

  // Pas de photo exploitable : emplacement neutre plutôt qu'une image cassée
  const src = failedIndexes.has(currentIndex) ? undefined : images[currentIndex];

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-linear-to-b from-[#EEF0F3] to-[#F5F6F8]">
      <div
        className={cn(
          'absolute inset-0 transition-transform duration-500 ease-out motion-reduce:transition-none group-hover:scale-[1.03]',
          unavailable && 'opacity-60 saturate-[0.35]'
        )}
      >
        {src ? (
        <Image
          src={src}
          alt={`${brand} ${model}${agencyCity ? ` à ${agencyCity}` : ''}${
            images.length > 1 ? ` (photo ${currentIndex + 1} sur ${images.length})` : ''
          }`}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 400px"
          className="object-cover"
          unoptimized={!isOptimizableImage(src)}
          onError={() => setFailedIndexes((prev) => new Set(prev).add(currentIndex))}
        />
        ) : (
          <div
            role="img"
            aria-label={`${brand} ${model} — photo indisponible`}
            className="flex h-full w-full items-center justify-center text-slate-300"
          >
            <CarFront className="h-14 w-14" strokeWidth={1.25} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/35 to-transparent" />

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => goTo(-1, e)}
            className={cn(ARROW_BASE, 'start-2')}
            aria-label="Image précédente"
          >
            <ChevronLeft className="h-4 w-4 text-slate-700 rtl:rotate-180" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(e) => goTo(1, e)}
            className={cn(ARROW_BASE, 'end-2')}
            aria-label="Image suivante"
          >
            <ChevronRight className="h-4 w-4 text-slate-700 rtl:rotate-180" aria-hidden="true" />
          </button>

          <div
            className="pointer-events-none absolute bottom-3 end-3 flex gap-1"
            aria-hidden="true"
          >
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1 rounded-full transition-all duration-300',
                  i === currentIndex ? 'w-3.5 bg-white' : 'w-1 bg-white/55'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function VehicleCardComponent({
  vehicle,
  priority = false,
  availabilityChecked = false,
  onFavorite,
  isFavorite: externalFavorite,
  selectedDays,
  onNotify,
}: VehicleCardProps) {
  const [internalFavorite, setInternalFavorite] = useState(false);
  const isFavorite = externalFavorite ?? internalFavorite;

  const images = vehicle.images ?? [];
  const { isBookable, style: status } = resolveStatus(vehicle.status, availabilityChecked);
  const agency = vehicle.agency;
  const reviewCount = agency?.review_count ?? 0;
  const agencyRating = typeof agency?.rating === 'number' ? agency.rating : null;
  const showRating = agencyRating !== null && reviewCount >= MIN_REVIEWS_FOR_RATING;
  const vehicleName = `${vehicle.brand} ${vehicle.model}`;
  const detailsHref = `/cars/${encodeURIComponent(vehicle.slug)}`;
  const totalPrice = selectedDays && selectedDays > 0 ? vehicle.daily_price * selectedDays : null;

  const handleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onFavorite) onFavorite(vehicle.id);
      else setInternalFavorite((prev) => !prev);
    },
    [onFavorite, vehicle.id]
  );

  const handleNotify = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onNotify?.(vehicle.id);
    },
    [onNotify, vehicle.id]
  );

  return (
    <article
      className={cn(
        // Apparition en CSS (framer-motion retiré des pages de liste)
        'animate-cd-fade-in motion-reduce:animate-none group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-white transition-[box-shadow,border-color,transform] duration-300 motion-reduce:transition-none',
        'border-slate-200/80 shadow-[0_1px_2px_rgba(11,18,32,0.05)]',
        'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_40px_-18px_rgba(11,18,32,0.28)] focus-within:border-[#0B1220] motion-reduce:hover:translate-y-0'
      )}
    >
      {/* ── Photo ─────────────────────────────────────────────────────── */}
      <div className="relative shrink-0">
        <VehicleGallery
          images={images}
          brand={vehicle.brand}
          model={vehicle.model}
          agencyCity={agency?.city}
          priority={priority}
          unavailable={!isBookable}
        />

        {/* Statut — pastille + texte (jamais la couleur seule) */}
        <span
          className={cn(
            'absolute start-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur-sm',
            status.text
          )}
        >
          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', status.dot)} aria-hidden="true" />
          {status.label}
        </span>

        <button
          type="button"
          onClick={handleFavorite}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Retirer ${vehicleName} des favoris` : `Ajouter ${vehicleName} aux favoris`}
          className={cn(
            'absolute end-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur-sm transition-[color,scale] duration-200 active:scale-110 motion-reduce:active:scale-100',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E63946]',
            isFavorite ? 'text-accent-text' : 'text-slate-500 hover:text-accent-text'
          )}
        >
          <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} aria-hidden="true" />
        </button>

        <span className="pointer-events-none absolute bottom-3 start-3 z-10 rounded-md bg-[#0B1220]/75 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
          {vehicle.category}
        </span>
      </div>

      {/* ── Contenu ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-4">
        <p className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          {vehicle.brand}
        </p>
        <h3 className="mt-0.5 truncate text-[17px] font-extrabold leading-snug text-[#0B1220]">
          {vehicle.model}
          <span className="ms-1.5 font-semibold text-slate-500">{vehicle.year}</span>
        </h3>

        <ul
          className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[13px] font-medium text-slate-600"
          aria-label="Caractéristiques du véhicule"
        >
          <li className="inline-flex items-center gap-1.5">
            <Gauge className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            {vehicle.transmission === 'AUTOMATIC' ? 'Automatique' : 'Manuelle'}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Fuel className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            {getFuelLabel(vehicle.fuel)}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            {vehicle.seats} places
          </li>
        </ul>

        {agency && (
          <div className="mt-3.5 flex min-w-0 items-center gap-2 rounded-xl bg-[#F5F6F8] px-2.5 py-2">
            <div className="h-6 w-6 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white">
              <AgencyLogo
                slug={agency.slug}
                name={agency.name}
                logoUrl={agency.logo_url}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="min-w-0 truncate text-xs font-bold text-slate-700">{agency.name}</span>
            {agency.verified && (
              <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Vérifiée
              </span>
            )}
            <span className="ms-auto shrink-0 text-[11px] font-semibold text-ink-tertiary">
              {showRating ? (
                <span
                  className="inline-flex items-center gap-1"
                  aria-label={`Note : ${agencyRating!.toFixed(1)} sur 5, ${reviewCount} avis`}
                >
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  {agencyRating!.toFixed(1).replace('.', ',')}
                </span>
              ) : (
                'Nouvelle'
              )}
            </span>
          </div>
        )}

        {/* Prix + action */}
        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-3">
            <p className="leading-none">
              <span className="text-[22px] font-extrabold tabular-nums tracking-tight text-[#0B1220]">
                {formatNumber(vehicle.daily_price)}
              </span>
              <span className="ms-1 text-xs font-bold text-[#0B1220]">MAD</span>
              <span className="ms-1 text-xs font-medium text-slate-500">/ jour</span>
            </p>
            {totalPrice !== null ? (
              <p className="text-end text-[11px] font-semibold text-slate-600">
                {formatMad(totalPrice)} · {selectedDays} j
              </p>
            ) : (vehicle.deposit ?? 0) > 0 ? (
              <p className="text-end text-[11px] font-medium text-slate-500">
                Caution {formatMad(vehicle.deposit)}
              </p>
            ) : null}
          </div>

          {!isBookable && vehicle.status === 'RENTED' && vehicle.available_from && (
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700">
              <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Disponible dès le{' '}
              {new Date(vehicle.available_from).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </p>
          )}

          <div className="mt-3 flex gap-2">
            {/* Lien étiré : toute la carte mène à la fiche du véhicule */}
            <Link
              href={detailsHref}
              className={cn(
                'flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-[13px] font-bold transition-colors duration-200',
                'outline-none after:absolute after:inset-0 after:z-10 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-[#E63946]',
                isBookable
                  ? 'bg-[#0B1220] text-white group-hover:bg-action'
                  : 'border border-slate-200 bg-white text-[#0B1220] group-hover:border-slate-300'
              )}
            >
              Voir les détails
              <span className="sr-only">
                {' '}: {vehicleName} {vehicle.year}, {formatMad(vehicle.daily_price)} par jour
              </span>
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            {!isBookable && onNotify && (
              <button
                type="button"
                onClick={handleNotify}
                className="relative z-20 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1220]"
                aria-label={`Me prévenir quand ${vehicleName} est disponible`}
              >
                <BellRing className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export const VehicleCard = memo(VehicleCardComponent);
