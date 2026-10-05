'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Vehicle } from '@/types';
import { store } from '@/lib/services/store';
import { formatPrice } from '@/lib/utils';
import { CarFront, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';

interface SameModelAlternativesProps {
  currentVehicle: Vehicle;
  title?: string;
  subtitle?: string;
}

export function SameModelAlternatives({
  currentVehicle,
  title = 'Véhicules similaires ou équivalents disponibles',
  subtitle = 'D’autres agences partenaires à Nador proposent ce modèle ou une catégorie équivalente.',
}: SameModelAlternativesProps) {
  const allVehicles = store.getVehicles();

  // Chercher même modèle dans d'autres agences d'abord, puis même catégorie
  const sameModelOthers = allVehicles.filter(
    (v) =>
      v.id !== currentVehicle.id &&
      v.brand.toLowerCase() === currentVehicle.brand.toLowerCase() &&
      v.model.toLowerCase() === currentVehicle.model.toLowerCase()
  );

  const sameCategoryOthers = allVehicles.filter(
    (v) =>
      v.id !== currentVehicle.id &&
      !sameModelOthers.some((s) => s.id === v.id) &&
      v.category === currentVehicle.category
  );

  const alternatives = [...sameModelOthers, ...sameCategoryOthers].slice(0, 3);

  if (alternatives.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl border border-slate-200/90 p-5 sm:p-6 my-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#02306B]">
            <CarFront className="w-4 h-4 text-[#FF7300]" />
            <span>Alternatives recommandées</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {alternatives.map((alt) => (
          <Link
            key={alt.id}
            href={`/cars/${alt.slug}`}
            className="group block bg-white rounded-xl border border-slate-200 p-3 hover:border-[#02306B] hover:shadow-md transition-all duration-200"
          >
            <div className="relative h-28 w-full rounded-lg overflow-hidden bg-slate-100 mb-2">
              <Image
                src={alt.images[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341'}
                alt={`${alt.brand} ${alt.model}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#02306B] text-white">
                {alt.agency?.name || 'Agence Nador'}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#02306B] transition-colors">
                  {alt.brand} {alt.model}
                </h4>
                <p className="text-[10px] text-slate-500">{alt.transmission === 'AUTOMATIC' ? 'Automatique' : 'Manuelle'} • {alt.fuel}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold text-[#02306B] block">
                  {formatPrice(alt.daily_price)}
                </span>
                <span className="text-[9px] text-slate-400">/jour</span>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-[#FF7300] group-hover:translate-x-0.5 transition-transform">
              <span>Voir l'alternative</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
