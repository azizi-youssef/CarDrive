'use client';

import React, { useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { store } from '@/lib/services/store';
import { findSameModelAlternatives } from '@/lib/availability/engine';
import { BookingCard } from '@/components/booking/BookingCard';
import { SameModelAlternatives } from '@/components/cars/SameModelAlternatives';
import { Badge } from '@/components/ui/Badge';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import {
  Users,
  Fuel,
  Gauge,
  DoorOpen,
  AirVent,
  ShieldCheck,
  Check,
  Star,
  MapPin,
  Calendar,
  Building2,
  ChevronRight,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface CarDetailsPageProps {
  params: Promise<{ slug: string }>;
}

export default function CarDetailsPage({ params }: CarDetailsPageProps) {
  const resolvedParams = use(params);
  const vehicle = store.getVehicleBySlug(resolvedParams.slug);

  if (!vehicle) {
    notFound();
  }

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Compute same-model cross-agency alternatives!
  const alternatives = findSameModelAlternatives({
    currentVehicle: vehicle,
    allVehicles: store.getVehicles(),
    allBookings: store.getBookings(),
  });

  const reviews = store.getReviewsForVehicle(vehicle.id);

  const images = vehicle.images && vehicle.images.length > 0
    ? vehicle.images
    : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop&q=80'];

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20">
      
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium truncate">
            <Link href="/" className="hover:text-slate-900">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link href="/search" className="hover:text-slate-900">Véhicules</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold truncate">
              {vehicle.brand} {vehicle.model}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Title & Agency Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider bg-teal-50 text-[#046c7a] px-2.5 py-1 rounded-md border border-teal-200">
                {vehicle.category}
              </span>
              <Badge variant={vehicle.status === 'AVAILABLE' ? 'available' : 'rented'} icon>
                {vehicle.status === 'AVAILABLE' ? 'Disponible immédiatement' : 'Actuellement loué'}
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                Réf: {vehicle.unit_number}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {vehicle.brand} {vehicle.model} ({vehicle.year})
            </h1>

            {vehicle.agency && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 mt-2">
                <span>Proposé par</span>
                <Link
                  href={`/agencies/${vehicle.agency.slug}`}
                  className="font-bold text-[#046c7a] hover:underline flex items-center gap-1"
                >
                  <Building2 className="w-4 h-4" />
                  {vehicle.agency.name}
                </Link>
                {vehicle.agency.verified && (
                  <Badge variant="verified" icon>Vérifiée</Badge>
                )}
                <span>•</span>
                <div className="flex items-center gap-1 text-amber-600 font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{vehicle.agency.rating.toFixed(1)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="sm:text-right hidden sm:block">
            <span className="text-xs text-slate-500 block">Tarif standard</span>
            <PriceDisplay price={vehicle.daily_price} size="xl" />
          </div>
        </div>

        {/* 2-Columns Layout: Content / Sticky Booking Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Content Area (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden p-3 shadow-sm space-y-3">
              <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-100">
                <Image
                  src={images[activeImageIndex]}
                  alt={`${vehicle.brand} ${vehicle.model} - Photo principale`}
                  fill
                  priority
                  className="object-cover transition-all duration-300"
                />
              </div>

              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2.5">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative aspect-[16/10] rounded-lg overflow-hidden border-2 transition-all ${
                        activeImageIndex === idx
                          ? 'border-[#046c7a] ring-2 ring-teal-200'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`Photo ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* KEY VEHICLE SPECS GRID */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4">
                Caractéristiques techniques
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <Gauge className="w-5 h-5 text-[#046c7a]" />
                  <span className="text-slate-400 font-medium block">Transmission</span>
                  <strong className="text-slate-800 text-sm">
                    {vehicle.transmission === 'AUTOMATIC' ? 'Automatique' : 'Manuelle'}
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <Fuel className="w-5 h-5 text-[#046c7a]" />
                  <span className="text-slate-400 font-medium block">Carburant</span>
                  <strong className="text-slate-800 text-sm">
                    {vehicle.fuel === 'DIESEL' ? 'Diesel' : vehicle.fuel === 'GASOLINE' ? 'Essence' : 'Hybride'}
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <Users className="w-5 h-5 text-[#046c7a]" />
                  <span className="text-slate-400 font-medium block">Capacité</span>
                  <strong className="text-slate-800 text-sm">
                    {vehicle.seats} Places
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <DoorOpen className="w-5 h-5 text-[#046c7a]" />
                  <span className="text-slate-400 font-medium block">Portes</span>
                  <strong className="text-slate-800 text-sm">
                    {vehicle.doors} Portes
                  </strong>
                </div>
              </div>
            </div>

            {/* FEATURES CHECKLIST */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4">
                Équipements & Options incluses
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vehicle.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-teal-50 text-[#046c7a] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-teal-50 text-[#046c7a] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Kilométrage illimité (à partir de 3 jours)</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-teal-50 text-[#046c7a] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Assurance collision & tiers incluse</span>
                </div>
              </div>
            </div>

            {/* CONDITIONS DE LOCATION */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                Conditions de location auprès de cette agence
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="text-slate-400 block mb-1">Caution demandée</span>
                  <strong className="text-slate-800 font-bold text-sm">{vehicle.deposit} DH</strong>
                  <p className="text-[10px] text-slate-500 mt-1">Par empreinte bancaire ou chèque à la prise en main</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="text-slate-400 block mb-1">Âge minimum</span>
                  <strong className="text-slate-800 font-bold text-sm">21 ans</strong>
                  <p className="text-[10px] text-slate-500 mt-1">Permis de conduire valide depuis plus de 2 ans</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="text-slate-400 block mb-1">Livraison locale</span>
                  <strong className="text-slate-800 font-bold text-sm">Gratuite</strong>
                  <p className="text-[10px] text-slate-500 mt-1">Aéroport Nador Al-Aroui ou Port de Beni Ansar</p>
                </div>
              </div>
            </div>

            {/* CRUCIAL SECTION: SAME-MODEL CROSS-AGENCY ALTERNATIVES */}
            <SameModelAlternatives
              currentVehicle={vehicle}
              alternatives={alternatives}
            />

            {/* REVIEWS */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">
                  Avis clients certifiés ({reviews.length})
                </h2>
                <div className="flex items-center gap-1 text-sm font-bold text-amber-600">
                  <Star className="w-4 h-4 fill-current" />
                  <span>4.9 / 5</span>
                </div>
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{rev.author_name}</span>
                        <div className="flex items-center text-amber-500 text-xs">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Aucun avis rédigé pour le moment sur cette immatriculation précise. L’agence dispose d’une excellente note globale.
                </p>
              )}
            </div>

          </div>

          {/* Sticky Booking Card (4 cols) */}
          <div className="lg:col-span-4">
            <BookingCard vehicle={vehicle} />
          </div>

        </div>

      </div>
    </div>
  );
}
