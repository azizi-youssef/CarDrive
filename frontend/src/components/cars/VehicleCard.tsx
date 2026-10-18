'use client';

import React, { memo, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Vehicle } from '@/types';
import { formatNumber, formatPrice, cn } from '@/lib/utils';
import {
  Heart,
  Users,
  Fuel,
  Gauge,
  Star,
  ShieldCheck,
  ArrowRight,
  Wind,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { AgencyLogo } from '@/components/agencies/AgencyLogo';

interface VehicleCardProps {
  vehicle: Vehicle;
  priority?: boolean;
  /** true quand la disponibilité a été vérifiée côté serveur pour les dates recherchées */
  availabilityChecked?: boolean;
  onFavorite?: (vehicleId: string) => void;
  isFavorite?: boolean;
}

const PLACEHOLDER_IMAGE = '/vehicle-placeholder.svg';

const STATUS_STYLES = {
  available: {
    label: 'Disponible',
    color: 'text-emerald-700',
    bg: 'border-emerald-200/80',
    dot: 'bg-emerald-500',
  },
  unavailable: {
    label: 'Non disponible',
    color: 'text-red-700',
    bg: 'border-red-200/80',
    dot: 'bg-red-500',
  },
  maintenance: {
    label: 'Maintenance',
    color: 'text-amber-700',
    bg: 'border-amber-200/80',
    dot: 'bg-amber-500',
  },
  unknown: {
    label: 'Non disponible',
    color: 'text-slate-600',
    bg: 'border-slate-200',
    dot: 'bg-slate-400',
  },
} as const;

/**
 * Une seule source de vérité pour le badge ET le CTA.
 * Si la disponibilité a été vérifiée pour les dates, un véhicule « RENTED »
 * (loué à d'autres dates) reste réservable.
 */
function resolveStatus(status: Vehicle['status'], availabilityChecked: boolean) {
  const bookable =
    status === 'AVAILABLE' || (availabilityChecked && status === 'RENTED');

  if (bookable) return { isBookable: true, style: STATUS_STYLES.available };

  switch (status) {
    case 'RENTED':
    case 'BLOCKED':
      return { isBookable: false, style: STATUS_STYLES.unavailable };
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
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-pulse motion-reduce:animate-none"
    >
      <div className="aspect-[16/10] bg-slate-100" />
      <div className="p-4 space-y-3">
        <div className="space-y-1.5">
          <div className="h-3 w-20 bg-slate-100 rounded" />
          <div className="h-5 w-36 bg-slate-100 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-7 bg-slate-100 rounded-lg" />
          ))}
        </div>
        <div className="flex justify-between items-end">
          <div className="h-7 w-28 bg-slate-100 rounded" />
          <div className="h-4 w-14 bg-slate-100 rounded" />
        </div>
        <div className="h-12 bg-slate-100 rounded-lg" />
        <div className="h-10 bg-slate-100 rounded-lg" />
      </div>
    </div>
  );
}

const ARROW_BASE =
  'absolute top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-opacity duration-150 ' +
  'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#02306B]';

function VehicleGallery({
  images,
  brand,
  model,
  agencyCity,
  priority,
}: {
  images: string[];
  brand: string;
  model: string;
  agencyCity?: string;
  priority: boolean;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedIndexes, setFailedIndexes] = useState<Set<number>>(() => new Set());

  // Si la liste d'images change, on repart de zéro
  const imagesKey = images.join('|');
  useEffect(() => {
    setCurrentIndex(0);
    setFailedIndexes(new Set());
  }, [imagesKey]);

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
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
      <div className="absolute inset-0 transition-transform duration-500 ease-out motion-reduce:transition-none group-hover:scale-[1.04]">
        <Image
          src={src}
          alt={`${brand} ${model}${agencyCity ? ` à ${agencyCity}` : ''}${images.length > 1 ? ` (photo ${currentIndex + 1} sur ${images.length})` : ''
            }`}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          unoptimized
          onError={() => setFailedIndexes((prev) => new Set(prev).add(currentIndex))}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => goTo(-1, e)}
            className={cn(ARROW_BASE, 'left-2.5')}
            aria-label="Image précédente"
          >
            <ChevronLeft className="w-4 h-4 text-slate-700" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(e) => goTo(1, e)}
            className={cn(ARROW_BASE, 'right-2.5')}
            aria-label="Image suivante"
          >
            <ChevronRight className="w-4 h-4 text-slate-700" aria-hidden="true" />
          </button>

          <div
            className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none"
            aria-hidden="true"
          >
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === currentIndex ? 'bg-white w-4' : 'bg-white/50 w-1.5'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SpecItem({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-50 text-slate-600 font-medium">
      <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </div>
  );
}

function VehicleCardComponent({
  vehicle,
  priority = false,
  availabilityChecked = false,
  onFavorite,
  isFavorite: externalFavorite,
}: VehicleCardProps) {
  const reduceMotion = useReducedMotion();
  const [internalFavorite, setInternalFavorite] = useState(false);
  const isFavorite = externalFavorite ?? internalFavorite;

  const images = vehicle.images?.length ? vehicle.images : [PLACEHOLDER_IMAGE];
  const { isBookable, style: status } = resolveStatus(vehicle.status, availabilityChecked);
  const fuelLabel = getFuelLabel(vehicle.fuel);
  const isAutomatic = vehicle.transmission === 'AUTOMATIC';
  const agency = vehicle.agency;
  const rating = typeof agency?.rating === 'number' ? agency.rating : null;
  const hasDeposit = (vehicle.deposit ?? 0) > 0;
  const vehicleName = `${vehicle.brand} ${vehicle.model}`;

  const handleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onFavorite) onFavorite(vehicle.id);
      else setInternalFavorite((prev) => !prev);
    },
    [onFavorite, vehicle.id]
  );

  const titleClasses =
    'text-base font-bold text-slate-900 leading-tight transition-colors group-hover:text-[#02306B]';

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
      className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-slate-900/10 hover:border-slate-300 focus-within:border-[#02306B] transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="relative flex-shrink-0">
        <VehicleGallery
          images={images}
          brand={vehicle.brand}
          model={vehicle.model}
          agencyCity={agency?.city}
          priority={priority}
        />

        {/* Statut */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold border backdrop-blur-sm bg-white/95',
              status.color,
              status.bg
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', status.dot)} aria-hidden="true" />
            {status.label}
          </div>
        </div>

        {/* Favori */}
        <motion.button
          type="button"
          onClick={handleFavorite}
          whileTap={reduceMotion ? undefined : { scale: 1.2 }}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Retirer ${vehicleName} des favoris` : `Ajouter ${vehicleName} aux favoris`}
          className={cn(
            'absolute top-2.5 right-2.5 z-20 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm border border-white/60 shadow-sm flex items-center justify-center transition-colors duration-200',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#02306B]',
            isFavorite ? 'text-[#E63946]' : 'text-slate-400 hover:text-[#E63946]'
          )}
        >
          <Heart
            className={cn('w-4 h-4 transition-all duration-200', isFavorite && 'fill-current scale-110')}
            aria-hidden="true"
          />
        </motion.button>

        {/* Catégorie */}
        <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none">
          <span className="text-[11px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-sm text-slate-700 px-2 py-0.5 rounded-md border border-white/60 shadow-sm">
            {vehicle.category}
          </span>
        </div>
      </div>

      {/* Corps */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Titre & note */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">
            {vehicle.brand} · {vehicle.year}
          </p>
          <h3 className={titleClasses}>
            {isBookable ? (
              <Link
                href={`/cars/${encodeURIComponent(vehicle.slug)}`}
                className="outline-none after:absolute after:inset-0 after:z-10 focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-[#02306B] after:rounded-2xl"
              >
                {vehicle.model}
                <span className="sr-only">, {vehicle.year}. Voir le véhicule</span>
              </Link>
            ) : (
              vehicle.model
            )}
          </h3>

          {rating !== null && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-current" aria-hidden="true" />
              <span className="text-xs font-semibold text-slate-700">
                <span className="sr-only">Note de l’agence : </span>
                {rating.toFixed(1)}
              </span>
              {(agency?.review_count ?? 0) > 0 && (
                <span className="text-xs text-slate-500">· {agency!.review_count} avis</span>
              )}
            </div>
          )}
        </div>

        {/* Caractéristiques */}
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <SpecItem icon={Gauge}>{isAutomatic ? 'Automatique' : 'Manuelle'}</SpecItem>
          <SpecItem icon={Fuel}>{fuelLabel}</SpecItem>
          <SpecItem icon={Users}>{vehicle.seats} places</SpecItem>
          {vehicle.air_conditioning && <SpecItem icon={Wind}>Climatisée</SpecItem>}
        </div>

        {/* Prix + agence + CTA */}
        <div className="space-y-2.5 mt-auto">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-0.5">À partir de</p>
              <p className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-[#0B1220] leading-none">
                  {formatNumber(vehicle.daily_price)} <span className="text-sm font-bold">DH</span>
                </span>
                <span className="text-xs text-slate-500 font-medium">/jour</span>
              </p>
            </div>
            {hasDeposit && (
              <div className="text-right">
                <p className="text-xs text-slate-500">Caution</p>
                <p className="text-xs font-bold text-slate-700">{formatPrice(vehicle.deposit)}</p>
              </div>
            )}
          </div>

          {agency && (
            <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#0B1220] text-xs font-bold text-white">
                <AgencyLogo
                  slug={agency.slug}
                  name={agency.name}
                  logoUrl={agency.logo_url}
                  className="h-full w-full rounded-md object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                  {agency.name}
                </p>
                {agency.city && (
                  <p className="text-xs text-slate-500 flex items-center gap-0.5 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span className="truncate">{agency.city}</span>
                  </p>
                )}
              </div>
              {agency.verified && (
                <ShieldCheck
                  className="w-4 h-4 text-emerald-500 shrink-0"
                  role="img"
                  aria-label="Agence vérifiée"
                />
              )}
            </div>
          )}

          {/* CTA visuel : le lien accessible est le titre (lien étendu à toute la carte) */}
          <div
            aria-hidden="true"
            className={cn(
              'w-full py-2.5 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-200',
              isBookable
                ? 'bg-[#0B1220] text-white group-hover:bg-[#1E293B] shadow-sm'
                : 'bg-slate-100 text-slate-500'
            )}
          >
            <span>{isBookable ? 'Voir le véhicule' : status.label}</span>
            {isBookable && (
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200 motion-reduce:transition-none" />
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export const VehicleCard = memo(VehicleCardComponent);