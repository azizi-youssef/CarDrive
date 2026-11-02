'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Vehicle } from '@/types';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { Badge } from '@/components/ui/Badge';
import { calculateDaysBetween, formatPrice } from '@/lib/utils';
import { LOCATIONS_NADOR } from '@/lib/constants/catalog';
import { addDateDays } from '@/lib/utils/date-only';
import { Calendar, MapPin, MessageSquare, Check, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { BookingRequestModal } from './BookingRequestModal';
import { Magnet } from '@/components/ui/react-bits';

interface BookingCardProps {
  vehicle: Vehicle;
}

function getInitialDates() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const later = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const inThreeDays = later.toISOString().split('T')[0];
  return { today, inThreeDays };
}

export function BookingCard({ vehicle }: BookingCardProps) {
  const [initialDates] = useState(getInitialDates);
  const today = initialDates.today;

  const [startDate, setStartDate] = useState(initialDates.today);
  const [endDate, setEndDate] = useState(initialDates.inThreeDays);
  const [location, setLocation] = useState('Aéroport Nador Al-Aroui (NDR)');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingSuccessRef, setBookingSuccessRef] = useState<string | null>(null);
  const [availability, setAvailability] = useState<'checking' | 'available' | 'unavailable' | 'error'>('checking');

  useEffect(() => {
    let active = true;
    const check = async () => {
      setAvailability('checking');
      try {
        const query = new URLSearchParams({ startDate, endDate });
        const response = await fetch(
          `/api/vehicles/${encodeURIComponent(vehicle.id)}/availability?${query}`,
          { cache: 'no-store' }
        );
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Échec de la vérification.');
        }
        if (active) setAvailability(result.data.available ? 'available' : 'unavailable');
      } catch {
        if (active) {
          // Si le service de vérification distante est temporairement indisponible,
          // on utilise le statut natif de la flotte au lieu de bloquer l'utilisateur
          setAvailability(vehicle.status === 'AVAILABLE' ? 'available' : 'unavailable');
        }
      }
    };

    void check();
    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') void check();
    };
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void check();
    }, 30_000);
    window.addEventListener('focus', refreshOnFocus);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [endDate, startDate, vehicle.id]);

  const totalDays = calculateDaysBetween(startDate, endDate);
  const totalPrice = totalDays * vehicle.daily_price;

  const handleOnlineBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/5 p-5 sm:p-6 sticky top-24">
      {/* Price Header */}
      <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-slate-100">
        <div>
          <PriceDisplay price={vehicle.daily_price} size="xl" />
          <span className="text-xs text-slate-500 block mt-0.5">
            Caution remboursable : {formatPrice(vehicle.deposit)}
          </span>
        </div>
        <Badge
          variant={availability === 'available' ? 'available' : 'rented'}
          icon
        >
          {availability === 'available'
            ? 'Disponible pour ces dates'
            : availability === 'checking'
              ? 'Vérification…'
              : availability === 'unavailable'
                ? 'Non disponible pour ces dates'
                : 'Disponible (confirmation agence)'}
        </Badge>
      </div>

      {bookingSuccessRef ? (
        /* Success State */
        <div className="py-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900">Demande enregistrée !</h4>
            <p className="text-xs text-slate-600 mt-1">
              Référence du dossier :{' '}
              <strong className="text-[#0B1220] font-mono text-sm">{bookingSuccessRef}</strong>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              L’agence <strong>{vehicle.agency?.name}</strong> a bien reçu votre demande et vous contactera dans les plus brefs délais.
            </p>
          </div>

          <Link
            href={`/account/bookings/${bookingSuccessRef}`}
            className="w-full py-3 px-4 rounded-xl bg-[#0B1220] hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Clock className="w-4 h-4 text-[#E63946]" />
            Suivre ma demande en direct
          </Link>

          <a
            href={`https://wa.me/212661987654?text=${encodeURIComponent(`Bonjour CarDrive, je viens d'envoyer la demande ${bookingSuccessRef} pour ${vehicle.brand} ${vehicle.model}. Pouvez-vous m'assister ?`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl border border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            Assistance Conciergerie CarDrive
          </a>

          <button
            onClick={() => setBookingSuccessRef(null)}
            className="text-xs text-slate-500 hover:underline block mx-auto pt-2"
          >
            Nouvelle demande
          </button>
        </div>
      ) : (
        /* Booking Form */
        <form onSubmit={handleOnlineBooking} className="space-y-4">

          {/* Dates Picker */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Départ
              </label>
              <input
                type="date"
                required
                min={today}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value >= endDate) setEndDate(addDateDays(e.target.value, 1));
                }}
                className="w-full bg-transparent text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer mt-0.5"
              />
            </div>
            <div className="border-l border-slate-200 pl-2.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Retour
              </label>
              <input
                type="date"
                required
                min={startDate ? addDateDays(startDate, 1) : today}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer mt-0.5"
              />
            </div>
          </div>
          {availability !== 'available' && (
            <p
              role="status"
              className={`text-xs ${availability === 'unavailable' ? 'text-rose-700' : 'text-slate-600'}`}
            >
              {availability === 'checking'
                ? 'Vérification de la disponibilité pour ces dates…'
                : availability === 'unavailable'
                  ? 'Ce véhicule n’est pas disponible pour la période choisie.'
                  : ''}
            </p>
          )}

          {/* Lieu */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Prise en charge à Nador
            </label>
            <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white text-xs">
              <MapPin className="w-4 h-4 text-[#0B1220] shrink-0" />
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                {LOCATIONS_NADOR.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Coordonnées Client */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom complet *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Youssef El Amrani"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#0B1220] focus:ring-1 focus:ring-[#0B1220]/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Téléphone / WhatsApp *
              </label>
              <input
                type="tel"
                required
                placeholder="+212 6..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#0B1220] focus:ring-1 focus:ring-[#0B1220]/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Pricing Summary & Transparency */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Durée estimée</span>
              <span className="font-semibold text-slate-900">{totalDays} jour{totalDays > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tarif journalier</span>
              <span className="font-semibold text-slate-900">{formatPrice(vehicle.daily_price)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Frais de service CarDrive</span>
              <span className="font-semibold text-emerald-700">0 DH (Gratuit)</span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-[#0B1220]">
              <span>Total location estimé</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>

            {/* Modalité de règlement & caution */}
            <div className="mt-2 pt-2 border-t border-dashed border-slate-200 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-700 font-medium">
                <span>Caution remboursable</span>
                <span className="font-bold text-slate-900">{formatPrice(vehicle.deposit)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>Assurance de base</span>
                <span className="text-emerald-700 font-semibold">Incluse (RC tiers)</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>Kilométrage</span>
                <span className="text-slate-700 font-medium">Inclus (dès 3 jours)</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>Annulation</span>
                <span className="text-slate-700 font-medium">Gratuite avant confirmation</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>Paiement</span>
                <span className="text-slate-700 font-medium">À l&apos;agence à la remise des clés</span>
              </div>
            </div>
          </div>

          {/* Action 1: Envoi de la demande de réservation (Modale 5 étapes) */}
          <Magnet strength={0.2} className="w-full">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={availability === 'unavailable'}
              className="w-full py-3.5 px-4 rounded-xl bg-[#E63946] hover:bg-[#C92F3B] disabled:bg-slate-300 disabled:shadow-none text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs hover:shadow-[0_4px_16px_rgba(230,57,70,0.3)] transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Calendar className="w-4 h-4 text-white" />
              <span>Demander cette voiture</span>
            </button>
          </Magnet>

          {/* Conciergerie CarDrive (assistance plateforme) */}
          <div className="pt-1 flex items-center justify-center">
            <a
              href={`https://wa.me/212661987654?text=${encodeURIComponent(`Bonjour CarDrive, j'ai une question sur le véhicule ${vehicle.brand} ${vehicle.model} (${vehicle.year}) avant d'envoyer ma demande.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-slate-500 hover:text-[#0B1220] font-medium flex items-center gap-1.5 transition-colors py-1"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Besoin d'aide ? Conciergerie CarDrive</span>
            </a>
          </div>

          {/* Reassurance */}
          <div className="pt-3 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Contrat officiel établi directement par l’agence</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Demande sans paiement immédiat</span>
            </div>
          </div>
        </form>
      )}

      {/* Modal complète 5 étapes */}
      <BookingRequestModal
        vehicle={vehicle}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultStartDate={startDate}
        defaultEndDate={endDate}
        defaultLocation={location}
      />

      {/* Sticky Mobile/Tablet Bar CTA (visible under 1024px lg) */}
      <div className="fixed bottom-0 left-0 right-0 p-3.5 bg-white/98 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(11,18,32,0.12)] z-40 lg:hidden flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-semibold text-slate-500 block">Total estimé ({totalDays}j)</span>
          <span className="text-base font-extrabold text-[#0B1220]">{formatPrice(totalPrice)}</span>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={availability !== 'available'}
          className="flex-1 max-w-xs py-3 px-4 rounded-xl bg-[#E63946] hover:bg-[#C92F3B] disabled:bg-slate-300 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:shadow-[0_4px_16px_rgba(230,57,70,0.3)] disabled:cursor-not-allowed transition-all active:scale-[0.99]"
        >
          <Calendar className="w-4 h-4 text-white" />
          <span>Demander cette voiture</span>
        </button>
      </div>
    </div>
  );
}
