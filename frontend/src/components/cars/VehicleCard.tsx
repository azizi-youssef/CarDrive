'use client';

import React, { memo, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Gauge,
  Users,
  Fuel,
  ShieldCheck,
  Star,
  MapPin,
  Heart,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  BellRing,
  CalendarX2,
  BadgeCheck,
  Sparkles,
} from 'lucide-react';
import type { Vehicle } from '@/types';
import { cn, formatPrice, formatNumber } from '@/lib/utils';
import { AgencyLogo } from '@/components/agencies/AgencyLogo';

interface VehicleCardProps {
  vehicle: Vehicle;
  priority?: boolean;
  availabilityChecked?: boolean;
  onFavorite?: (id: string) => void;
  isFavorite?: boolean;
  /** Nombre de jours sélectionnés dans la barre de dates (pour afficher le prix total) */
  selectedDays?: number;
  /** Date de début sélectionnée (pour afficher le prix total) */
  onNotify?: (vehicleId: string) => void;
}

const PLACEHOLDER_IMAGE = '/cars/default.png';
const MIN_REVIEWS_FOR_RATING = 5;

const STATUS_STYLES = {
  available: {
    label: 'Disponible',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: '✓',
  },
  reserved: {
    label: 'Réservé',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    dot: 'bg-amber-500',
    icon: '◷',
  },
  rented: {
    label: 'En location',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    dot: 'bg-blue-500',
    icon: '↗',
  },
  maintenance: {
    label: 'Maintenance',
    color: 'text-slate-600',
    bg: 'bg-slate-50 border-slate-200',
    dot: 'bg-slate-400',
    icon: '⚙',
  },
  unknown: {
    label: 'Indisponible',
    color: 'text-slate-600',
    bg: 'bg-slate-50 border-slate-200',
    dot: 'bg-slate-400',
    icon: '✕',
  },
} as const;

function resolveStatus(rawStatus?: string, checked?: boolean) {
  if (checked) {
    return { isBookable: true, style: STATUS_STYLES.available };
  }
  switch (rawStatus) {
    case 'AVAILABLE':
      return { isBookable: true, style: STATUS_STYLES.available };
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

export function VehicleCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs animate-pulse motion-reduce:animate-none"
    >
      <div className="aspect-3/2 bg-slate-100" />
      <div className="p-3.5 space-y-2.5">
        <div className="flex justify-between items-center">
          <div className="h-3.5 w-24 bg-slate-100 rounded" />
          <div className="h-3.5 w-12 bg-slate-100 rounded" />
        </div>
        <div className="h-5 w-40 bg-slate-100 rounded" />
        <div className="flex gap-1.5">
          <div className="h-6 w-16 bg-slate-100 rounded-md" />
          <div className="h-6 w-16 bg-slate-100 rounded-md" />
          <div className="h-6 w-14 bg-slate-100 rounded-md" />
        </div>
        <div className="h-5 w-full bg-slate-100 rounded" />
        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <div className="h-6 w-24 bg-slate-100 rounded" />
          <div className="h-9 w-24 bg-slate-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

const ARROW_BASE =
  'absolute top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-opacity duration-150 ' +
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

  const src = failedIndexes.has(currentIndex)
    ? PLACEHOLDER_IMAGE
    : (images[currentIndex] ?? PLACEHOLDER_IMAGE);

  return (
    <div className="relative aspect-3/2 w-full overflow-hidden bg-slate-100">
      <div
        className={cn(
          'absolute inset-0 transition-transform duration-500 ease-out motion-reduce:transition-none group-hover:scale-[1.04]',
          unavailable && 'opacity-50 grayscale'
        )}
      >
        <Image
          src={src}
          alt={`${brand} ${model}${agencyCity ? ` à ${agencyCity}` : ''}${
            images.length > 1 ? ` (photo ${currentIndex + 1} sur ${images.length})` : ''
          }`}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          unoptimized
          onError={() => setFailedIndexes((prev) => new Set(prev).add(currentIndex))}
        />
      </div>

      <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => goTo(-1, e)}
            className={cn(ARROW_BASE, 'left-2')}
            aria-label="Image précédente"
          >
            <ChevronLeft className="w-4 h-4 text-slate-700" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(e) => goTo(1, e)}
            className={cn(ARROW_BASE, 'right-2')}
            aria-label="Image suivante"
          >
            <ChevronRight className="w-4 h-4 text-slate-700" aria-hidden="true" />
          </button>

          <div
            className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 pointer-events-none"
            aria-hidden="true"
          >
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1 rounded-full transition-all duration-300',
                  i === currentIndex ? 'bg-white w-3.5' : 'bg-white/50 w-1'
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
  const reduceMotion = useReducedMotion();
  const [internalFavorite, setInternalFavorite] = useState(false);
  const isFavorite = externalFavorite ?? internalFavorite;

  const images = vehicle.images?.length ? vehicle.images : [PLACEHOLDER_IMAGE];
  const { isBookable, style: status } = resolveStatus(vehicle.status, availabilityChecked);
  const fuelLabel = getFuelLabel(vehicle.fuel);
  const isAutomatic = vehicle.transmission === 'AUTOMATIC';
  const agency = vehicle.agency;
  const reviewCount = agency?.review_count ?? 0;
  const agencyRating = typeof agency?.rating === 'number' ? agency.rating : null;
  const showRating = agencyRating !== null && reviewCount >= MIN_REVIEWS_FOR_RATING;
  const isNew = agencyRating === null || reviewCount < MIN_REVIEWS_FOR_RATING;
  const hasDeposit = (vehicle.deposit ?? 0) > 0;
  const vehicleName = `${vehicle.brand} ${vehicle.model}`;
  const isUnavailable = !isBookable;

  // Prix total estimé quand des jours sont sélectionnés
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
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
      className={cn(
        'group relative bg-white rounded-2xl border overflow-hidden shadow-xs transition-all duration-300 flex flex-col',
        isUnavailable
          ? 'border-slate-200 opacity-80'
          : 'border-slate-200 hover:shadow-lg hover:shadow-slate-900/8 hover:border-slate-300 focus-within:border-[#0B1220]'
      )}
    >
      {/* ── Image & Badges ────────────────────────────────────────────── */}
      <div className="relative shrink-0">
        <VehicleGallery
          images={images}
          brand={vehicle.brand}
          model={vehicle.model}
          agencyCity={agency?.city}
          priority={priority}
          unavailable={isUnavailable}
        />

        {/* Statut badge — toujours icône + texte (jamais couleur seule) */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold border backdrop-blur-sm bg-white/95 shadow-xs',
              status.color,
              status.bg
            )}
            role="status"
            aria-label={status.label}
          >
            <span className={cn('w-2 h-2 rounded-full shrink-0', status.dot)} aria-hidden="true" />
            {status.label}
          </div>
        </div>

        {/* Nouveau badge */}
        {isNew && isBookable && (
          <div className="absolute top-2.5 left-[calc(100%-5rem)] z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
              <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
              Nouveau
            </span>
          </div>
        )}

        {/* Favori button — min 44px touch target */}
        <motion.button
          type="button"
          onClick={handleFavorite}
          whileTap={reduceMotion ? undefined : { scale: 1.15 }}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Retirer ${vehicleName} des favoris` : `Ajouter ${vehicleName} aux favoris`}
          className={cn(
            'absolute top-2.5 right-2.5 z-20 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm border border-white/60 shadow-xs flex items-center justify-center transition-colors duration-200',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E63946]',
            isFavorite ? 'text-[#E63946]' : 'text-slate-400 hover:text-[#E63946]'
          )}
        >
          <Heart
            className={cn('w-4 h-4 transition-all duration-200', isFavorite && 'fill-current scale-110')}
            aria-hidden="true"
          />
        </motion.button>

        {/* Catégorie chip */}
        <div className="absolute bottom-2 left-2.5 z-10 pointer-events-none">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-sm text-slate-700 px-2 py-0.5 rounded border border-white/60 shadow-2xs">
            {vehicle.category}
          </span>
        </div>
      </div>

      {/* ── Corps compact ─────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-4 gap-2">
        {/* Ligne 1 : Marque/Année & Note avis */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
              {vehicle.brand} · {vehicle.year}
            </p>
            {showRating ? (
              <span
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 shrink-0"
                aria-label={`Note : ${agencyRating!.toFixed(1)} sur 5, ${reviewCount} avis`}
              >
                <Star className="w-3.5 h-3.5 text-amber-400 fill-current" aria-hidden="true" />
                {agencyRating!.toFixed(1).replace('.', ',')}
                <span className="text-slate-400 font-normal text-[11px]">· {reviewCount} avis</span>
              </span>
            ) : isNew && isBookable ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 shrink-0">
                <BadgeCheck className="w-3 h-3" aria-hidden="true" />
                Nouveau
              </span>
            ) : null}
          </div>

          {/* Titre du véhicule */}
          <h3 className="text-base font-bold text-slate-900 leading-snug mt-0.5 transition-colors group-hover:text-[#E63946] truncate">
            {isBookable ? (
              <Link
                href={`/cars/${encodeURIComponent(vehicle.slug)}`}
                className="outline-none after:absolute after:inset-0 after:z-10 focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-[#E63946] after:rounded-2xl"
              >
                {vehicle.model}
                <span className="sr-only">, {vehicle.year}. Demander ce véhicule</span>
              </Link>
            ) : (
              vehicle.model
            )}
          </h3>
        </div>

        {/* Ligne 2 : Spécifications techniques en ligne scrollable sur mobile */}
        <div
          className="flex items-center gap-1 text-xs text-slate-600 overflow-x-auto no-scrollbar"
          role="list"
          aria-label="Caractéristiques du véhicule"
        >
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 border border-slate-100 font-medium shrink-0 whitespace-nowrap"
            role="listitem"
          >
            <Gauge className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
            {isAutomatic ? 'Automatique' : 'Manuelle'}
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 border border-slate-100 font-medium shrink-0 whitespace-nowrap"
            role="listitem"
          >
            <Fuel className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
            {fuelLabel}
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 border border-slate-100 font-medium shrink-0 whitespace-nowrap"
            role="listitem"
          >
            <Users className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
            {vehicle.seats} places
          </span>
          {vehicle.min_rental_days > 1 && (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 border border-slate-100 font-medium shrink-0 whitespace-nowrap"
              role="listitem"
            >
              <CalendarX2 className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
              min {vehicle.min_rental_days} j
            </span>
          )}
        </div>

        {/* Ligne 3 : Agence partenaire */}
        {agency && (
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="h-5 w-5 shrink-0 rounded overflow-hidden bg-slate-100 border border-slate-200">
                <AgencyLogo
                  slug={agency.slug}
                  name={agency.name}
                  logoUrl={agency.logo_url}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-xs font-semibold text-slate-700 truncate">{agency.name}</span>
              {agency.verified && (
                <ShieldCheck
                  className="w-3.5 h-3.5 text-emerald-500 shrink-0"
                  role="img"
                  aria-label="Agence vérifiée"
                />
              )}
            </div>
            {agency.city && (
              <span className="text-[11px] text-slate-400 truncate flex items-center gap-0.5 shrink-0 ml-1">
                <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                {agency.city}
              </span>
            )}
          </div>
        )}

        {/* Ligne 4 : Prix + Bouton CTA */}
        <div className="flex items-end justify-between gap-2 pt-2 border-t border-slate-100 mt-auto">
          <div className="min-w-0">
            <p className="flex items-baseline gap-1 leading-none">
              <span className="text-lg sm:text-xl font-extrabold text-[#0B1220] tabular-nums tracking-tight">
                {formatNumber(vehicle.daily_price)} <span className="text-xs font-bold">DH</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">/jour</span>
            </p>
            {totalPrice !== null && (
              <p className="text-[11px] text-[#0B1220] font-bold mt-0.5">
                = {formatNumber(totalPrice)} DH pour {selectedDays} j
              </p>
            )}
            {hasDeposit && !totalPrice && (
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                Caution : {formatPrice(vehicle.deposit)}
              </p>
            )}
          </div>

          {/* CTA — pleine largeur sur mobile */}
          {isBookable ? (
            <div
              aria-hidden="true"
              className="py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 shrink-0 bg-[#0B1220] text-white group-hover:bg-[#E63946] shadow-2xs min-h-[44px]"
            >
              <span>Demander</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200 motion-reduce:transition-none" aria-hidden="true" />
            </div>
          ) : (
            <button
              type="button"
              onClick={handleNotify}
              className="py-2.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 shrink-0 bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1220]"
              aria-label={`Me prévenir quand ${vehicleName} est disponible`}
            >
              <BellRing className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Me prévenir</span>
            </button>
          )}
        </div>

        {/* Disponibilité future si RENTED */}
        {vehicle.status === 'RENTED' && vehicle.available_from && (
          <p className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 -mt-1">
            <CalendarX2 className="w-3 h-3 shrink-0" aria-hidden="true" />
            Disponible dès le {new Date(vehicle.available_from).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </p>
        )}
      </div>
    </motion.article>
  );
}

export const VehicleCard = memo(VehicleCardComponent);
