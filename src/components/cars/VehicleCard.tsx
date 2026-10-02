'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Vehicle } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { Heart, Users, Fuel, Gauge, Star, Building2, ShieldCheck, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VehicleCardProps {
  vehicle: Vehicle;
  priority?: boolean;
}

export function VehicleCard({ vehicle, priority = false }: VehicleCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const primaryImage =
    vehicle.images && vehicle.images.length > 0
      ? vehicle.images[0]
      : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80';

  const isAutomatic = vehicle.transmission === 'AUTOMATIC';
  const fuelLabel = vehicle.fuel === 'DIESEL' ? 'Diesel' : vehicle.fuel === 'GASOLINE' ? 'Essence' : 'Hybride';

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden card-hover flex flex-col justify-between shadow-sm relative">
      
      {/* Top Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <Image
          src={primaryImage}
          alt={`${vehicle.brand} ${vehicle.model} à Nador`}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Gradient Overlay for badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
          <Badge variant={vehicle.status === 'AVAILABLE' ? 'available' : 'rented'} icon>
            {vehicle.status === 'AVAILABLE' ? 'Disponible' : 'Réservé'}
          </Badge>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsFavorite(!isFavorite);
            }}
            className={cn(
              'w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow transition-all',
              isFavorite ? 'text-red-500 scale-110' : 'text-slate-500 hover:text-red-500'
            )}
            aria-label="Ajouter aux favoris"
          >
            <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
          </button>
        </div>

        {/* Category Tag bottom left */}
        <div className="absolute bottom-2.5 left-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider bg-white/95 text-slate-800 px-2.5 py-1 rounded-md shadow-sm">
            {vehicle.category}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Title & Year */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-bold text-lg text-slate-900 group-hover:text-[#046c7a] transition-colors leading-tight">
                {vehicle.brand} {vehicle.model}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Modèle {vehicle.year} • {vehicle.unit_number}
              </p>
            </div>

            {/* Price highlight */}
            <div className="text-right">
              <PriceDisplay price={vehicle.daily_price} size="md" />
            </div>
          </div>

          {/* Quick Specifications */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 my-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5" title="Transmission">
              <Gauge className="w-3.5 h-3.5 text-[#046c7a]" />
              <span className="truncate">{isAutomatic ? 'Auto' : 'Manuelle'}</span>
            </div>
            <div className="flex items-center gap-1.5" title="Carburant">
              <Fuel className="w-3.5 h-3.5 text-[#046c7a]" />
              <span className="truncate">{fuelLabel}</span>
            </div>
            <div className="flex items-center gap-1.5" title="Nombre de places">
              <Users className="w-3.5 h-3.5 text-[#046c7a]" />
              <span>{vehicle.seats} places</span>
            </div>
          </div>
        </div>

        {/* Agency Information & CTA */}
        <div>
          {vehicle.agency && (
            <div className="flex items-center justify-between mb-3 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md bg-teal-100/70 text-[#046c7a] flex items-center justify-center font-bold text-[10px] shrink-0">
                  {vehicle.agency.name.charAt(0)}
                </div>
                <div className="truncate">
                  <span className="font-semibold text-slate-800 truncate block">
                    {vehicle.agency.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 text-amber-600 font-bold text-xs">
                <Star className="w-3 h-3 fill-current" />
                <span>{vehicle.agency.rating.toFixed(1)}</span>
                {vehicle.agency.verified && (
                  <span title="Agence vérifiée">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#046c7a] ml-1" />
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <Link
            href={`/cars/${vehicle.slug}`}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-[#046c7a] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors group/btn shadow-sm"
          >
            <span>Voir le véhicule & réserver</span>
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>

      </div>
    </div>
  );
}
