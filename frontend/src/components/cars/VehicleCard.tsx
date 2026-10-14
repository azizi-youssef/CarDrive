'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Vehicle } from '@/types';
import { formatNumber, formatPrice } from '@/lib/utils';
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
import { cn } from '@/lib/utils';
import { AgencyLogo } from '@/components/agencies/AgencyLogo';

interface VehicleCardProps {
  vehicle: Vehicle;
  priority?: boolean;
  availabilityChecked?: boolean;
  onFavorite?: (vehicleId: string) => void;
  isFavorite?: boolean;
}

function getStatusConfig(status: Vehicle['status'], availabilityChecked: boolean) {
  if (availabilityChecked && (status === 'AVAILABLE' || status === 'RENTED')) {
    return {
      label: 'Disponible',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50 border-emerald-200/80',
      dot: 'bg-emerald-500',
    };
  }

  switch (status) {
    case 'AVAILABLE':
      return {
        label: 'Disponible',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50 border-emerald-200/80',
        dot: 'bg-emerald-500',
      };
    case 'RENTED':
      return {
        label: 'Non disponible',
        color: 'text-red-700',
        bg: 'bg-red-50 border-red-200/80',
        dot: 'bg-red-500',
      };
    case 'MAINTENANCE':
      return {
        label: 'Maintenance',
        color: 'text-amber-700',
        bg: 'bg-amber-50 border-amber-200/80',
        dot: 'bg-amber-500',
      };
    case 'BLOCKED':
      return {
        label: 'Non disponible',
        color: 'text-red-700',
        bg: 'bg-red-50 border-red-200/80',
        dot: 'bg-red-500',
      };
    default:
      return {
        label: 'Non disponible',
        color: 'text-slate-600',
        bg: 'bg-slate-50 border-slate-200',
        dot: 'bg-slate-400',
      };
  }
}

function getFuelLabel(fuel: Vehicle['fuel']): string {
  const map: Record<string, string> = {
    DIESEL: 'Diesel',
    GASOLINE: 'Essence',
    HYBRID: 'Hybride',
    ELECTRIC: 'Électrique',
  };
  return map[fuel] ?? fuel;
}

export function VehicleCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-[16/10] bg-slate-100" />
      <div className="p-3.5 space-y-2.5">
        <div className="space-y-1.5">
          <div className="h-2.5 w-16 bg-slate-100 rounded" />
          <div className="h-5 w-32 bg-slate-100 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-6 bg-slate-100 rounded-md" />
          ))}
        </div>
        <div className="h-px bg-slate-100" />
        <div className="flex justify-between items-center">
          <div className="h-6 w-24 bg-slate-100 rounded" />
          <div className="h-3 w-16 bg-slate-100 rounded" />
        </div>
        <div className="h-9 bg-slate-100 rounded-lg" />
      </div>
    </div>
  );
}

function VehicleGallery({ images, brand, model, agencyCity, priority }: {
  images: string[];
  brand: string;
  model: string;
  agencyCity?: string;
  priority: boolean;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [failedImageIndexes, setFailedImageIndexes] = useState<Set<number>>(
    () => new Set()
  );

  const goTo = useCallback((dir: 1 | -1, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + dir + images.length) % images.length);
  }, [images.length]);

  return (
    <div
      className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ scale: isHovered ? 1.04 : 1 }}
        transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
      >
        <Image
          src={
            failedImageIndexes.has(currentIndex)
              ? '/vehicle-placeholder.svg'
              : images[currentIndex]!
          }
          alt={`${brand} ${model}${agencyCity ? ` à ${agencyCity}` : ''}`}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          unoptimized
          onError={() => {
            setFailedImageIndexes((previous) => new Set(previous).add(currentIndex));
          }}
        />
      </motion.div>

      {/* Bottom gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />

      {/* Nav arrows */}
      {images.length > 1 && (
        <AnimatePresence>
          {isHovered && (
            <>
              <motion.button
                key="prev"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => goTo(-1, e)}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/92 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition z-10"
                aria-label="Image précédente"
              >
                <ChevronLeft className="w-4 h-4 text-slate-700" />
              </motion.button>
              <motion.button
                key="next"
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => goTo(1, e)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/92 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition z-10"
                aria-label="Image suivante"
              >
                <ChevronRight className="w-4 h-4 text-slate-700" />
              </motion.button>
            </>
          )}
        </AnimatePresence>
      )}

      {/* Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
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
      )}
    </div>
  );
}

export function VehicleCard({
  vehicle,
  priority = false,
  availabilityChecked = false,
  onFavorite,
  isFavorite: externalFavorite,
}: VehicleCardProps) {
  const [internalFavorite, setInternalFavorite] = useState(false);
  const isFavorite = externalFavorite ?? internalFavorite;

  const images = vehicle.images?.length > 0
    ? vehicle.images
    : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80'];

  const statusConfig = getStatusConfig(vehicle.status, availabilityChecked);
  const isAvailable = vehicle.status === 'AVAILABLE';
  const fuelLabel = getFuelLabel(vehicle.fuel);
  const isAutomatic = vehicle.transmission === 'AUTOMATIC';

  const handleFavorite = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFavorite) onFavorite(vehicle.id);
    else setInternalFavorite((prev) => !prev);
  }, [onFavorite, vehicle.id]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-slate-900/8 hover:border-slate-300 transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="relative flex-shrink-0">
        <VehicleGallery
          images={images}
          brand={vehicle.brand}
          model={vehicle.model}
          agencyCity={vehicle.agency?.city}
          priority={priority}
        />

        {/* Status badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <div className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border backdrop-blur-sm bg-white/95',
            statusConfig.color,
            statusConfig.bg
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusConfig.dot)} />
            {statusConfig.label}
          </div>
        </div>

        {/* Favorite */}
        <motion.button
          type="button"
          onClick={handleFavorite}
          whileTap={{ scale: 1.2 }}
          className={cn(
            'absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-white/92 backdrop-blur-sm border border-white/60 shadow-xs flex items-center justify-center transition-colors duration-200',
            isFavorite ? 'text-[#E63946]' : 'text-slate-400 hover:text-[#E63946]'
          )}
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart className={cn('w-3.5 h-3.5 transition-all duration-200', isFavorite && 'fill-current scale-110')} />
        </motion.button>

        {/* Category tag */}
        <div className="absolute bottom-2.5 left-2.5 z-10">
          <span className="text-[9px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-sm text-slate-700 px-2 py-0.5 rounded-md border border-white/60 shadow-xs">
            {vehicle.category}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3.5 gap-2.5">

        {/* Title & Rating */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
            {vehicle.brand} · {vehicle.year}
          </p>
          <h3 className="text-[15px] font-bold text-slate-900 leading-tight group-hover:text-[#0B1220] transition-colors">
            {vehicle.model}
          </h3>
          {vehicle.agency && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className={cn('w-2.5 h-2.5', i <= Math.round(vehicle.agency!.rating) ? 'text-amber-400 fill-current' : 'text-slate-200 fill-current')} />
                ))}
              </div>
              <span className="text-[11px] font-semibold text-slate-700">{vehicle.agency.rating.toFixed(1)}</span>
              {vehicle.agency.review_count > 0 && (
                <span className="text-[10px] text-slate-400">· {vehicle.agency.review_count} avis</span>
              )}
            </div>
          )}
        </div>

        {/* Specs */}
        <div className="grid grid-cols-2 gap-1 text-[10.5px]">
          <div className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-50 text-slate-600 font-medium">
            <Gauge className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{isAutomatic ? 'Auto' : 'Manuelle'}</span>
          </div>
          <div className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-50 text-slate-600 font-medium">
            <Fuel className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{fuelLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-50 text-slate-600 font-medium">
            <Users className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{vehicle.seats} places</span>
          </div>
          {vehicle.air_conditioning && (
            <div className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-50 text-slate-600 font-medium">
              <Wind className="w-3 h-3 text-slate-400 shrink-0" />
              <span>Climatisée</span>
            </div>
          )}
        </div>

        {/* Price + Agency */}
        <div className="space-y-2 mt-auto">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9.5px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">À partir de</p>
              <div className="flex items-baseline gap-1">
                <span className="text-[18px] font-extrabold text-[#0B1220] leading-none">
                  {formatNumber(vehicle.daily_price)}{' '}
                  <span className="text-[12px] font-bold">DH</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">/jour</span>
              </div>
            </div>
            {vehicle.deposit > 0 && (
              <div className="text-right">
                <p className="text-[9.5px] text-slate-400">Caution</p>
                <p className="text-[11px] font-bold text-slate-600">{formatPrice(vehicle.deposit)}</p>
              </div>
            )}
          </div>

          {/* Agency strip */}
          {vehicle.agency && (
            <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#0B1220] text-[10px] font-bold text-white">
                <AgencyLogo
                  slug={vehicle.agency.slug}
                  name={vehicle.agency.name}
                  logoUrl={vehicle.agency.logo_url}
                  className="h-full w-full rounded-md object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-800 truncate leading-tight">
                  {vehicle.agency.name}
                </p>
                {vehicle.agency.city && (
                  <p className="text-[9.5px] text-slate-400 flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                    {vehicle.agency.city}
                  </p>
                )}
              </div>
              {vehicle.agency.verified && (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-label="Agence vérifiée" />
              )}
            </div>
          )}

          {/* CTA */}
          <Link
            href={`/cars/${vehicle.slug}`}
            aria-label={`Voir le ${vehicle.brand} ${vehicle.model}`}
            className={cn(
              'group/cta w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200',
              isAvailable
                ? 'bg-[#0B1220] text-white hover:bg-[#1E293B] shadow-xs'
                : 'bg-slate-100 text-slate-400 cursor-default pointer-events-none'
            )}
            tabIndex={isAvailable ? 0 : -1}
            aria-disabled={!isAvailable}
          >
            <span>{isAvailable ? 'Voir le véhicule' : 'Non disponible'}</span>
            {isAvailable && (
              <ArrowRight className="w-3.5 h-3.5 group-hover/cta:translate-x-1 transition-transform duration-200" />
            )}
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
