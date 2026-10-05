'use client';

import React, { useState } from 'react';
import { Vehicle } from '@/types';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { Badge } from '@/components/ui/Badge';
import { calculateDaysBetween, generateBookingRef, generateWhatsAppLink, formatPrice } from '@/lib/utils';
import { LOCATIONS_NADOR } from '@/lib/services/mockData';
import { store } from '@/lib/services/store';
import { Calendar, MapPin, MessageSquare, Check, ShieldCheck, Phone, CheckCircle2, Clock } from 'lucide-react';
import { BookingRequestModal } from './BookingRequestModal';

interface BookingCardProps {
  vehicle: Vehicle;
}

export function BookingCard({ vehicle }: BookingCardProps) {
  const today = new Date().toISOString().split('T')[0];
  const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(inThreeDays);
  const [location, setLocation] = useState('Aéroport Nador Al-Aroui (NDR)');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingSuccessRef, setBookingSuccessRef] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalDays = calculateDaysBetween(startDate, endDate);
  const totalPrice = totalDays * vehicle.daily_price;

  const handleOnlineBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert('Veuillez renseigner votre nom et numéro de téléphone');
      return;
    }

    setIsSubmitting(true);
    const bookingRef = generateBookingRef();

    setTimeout(() => {
      store.createBooking({
        reference: bookingRef,
        booking_ref: bookingRef,
        vehicle_id: vehicle.id,
        agency_id: vehicle.agency_id,
        customer_name: name,
        customer_email: email || `${phone.replace(/\s+/g, '')}@cardrive.ma`,
        customer_phone: phone,
        start_date: startDate,
        end_date: endDate,
        pickup_time: '10:00',
        dropoff_time: '10:00',
        pickup_location: location,
        dropoff_location: location,
        total_days: totalDays,
        daily_price: vehicle.daily_price,
        total_price: totalPrice,
        commission_rate: 0.15,
        commission_amount: Math.round(totalPrice * 0.15),
        agency_amount: totalPrice - Math.round(totalPrice * 0.15),
        deposit_amount: vehicle.deposit,
        status: 'PENDING',
      });

      setIsSubmitting(false);
      setBookingSuccessRef(bookingRef);
    }, 400);
  };

  const whatsappUrl = generateWhatsAppLink({
    phone: vehicle.agency?.whatsapp || '+212661234567',
    vehicleName: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
    agencyName: vehicle.agency?.name || 'l’agence',
    startDate,
    endDate,
    totalPrice,
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-blue-950/5 p-5 sm:p-6 sticky top-24">
      {/* Price Header */}
      <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-slate-100">
        <div>
          <PriceDisplay price={vehicle.daily_price} size="xl" />
          <span className="text-xs text-slate-500 block mt-0.5">
            Caution remboursable : {formatPrice(vehicle.deposit)}
          </span>
        </div>
        <Badge variant={vehicle.status === 'AVAILABLE' ? 'available' : 'rented'} icon>
          {vehicle.status === 'AVAILABLE' ? 'En stock' : 'Indisponible'}
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
              <strong className="text-[#02306B] font-mono text-sm">{bookingSuccessRef}</strong>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              L’agence <strong>{vehicle.agency?.name}</strong> a bien reçu votre demande et vous contactera dans les plus brefs délais.
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Confirmer aussi sur WhatsApp
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
                min={today}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
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
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer mt-0.5"
              />
            </div>
          </div>

          {/* Lieu */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Prise en charge à Nador
            </label>
            <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white text-xs">
              <MapPin className="w-4 h-4 text-[#02306B] shrink-0" />
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
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#02306B] focus:ring-1 focus:ring-[#02306B] outline-none"
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
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#02306B] focus:ring-1 focus:ring-[#02306B] outline-none"
              />
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Durée estimée</span>
              <span className="font-semibold text-slate-900">{totalDays} jour{totalDays > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tarif journalier</span>
              <span className="font-semibold text-slate-900">{formatPrice(vehicle.daily_price)}</span>
            </div>
            
            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-[#0B1220]">
              <span>Total location</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>

            {/* Modalité de règlement : 15% plateforme / 85% agence */}
            <div className="mt-2 pt-2 border-t border-dashed border-slate-200 space-y-1 text-[11px]">
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Commission plateforme (15%)</span>
                <span className="font-bold">{formatPrice(Math.round(totalPrice * 0.15))}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Solde à régler à l'agence (85%)</span>
                <span className="font-semibold">{formatPrice(totalPrice - Math.round(totalPrice * 0.15))}</span>
              </div>
            </div>
          </div>

          {/* Action 1: Envoi de la demande de réservation (Modale 5 étapes) */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full py-3.5 px-4 rounded-xl bg-[#02306B] hover:bg-[#064181] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/15 hover:shadow-xl transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-[#FF7300]" />
            <span>Demander cette voiture</span>
          </button>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-semibold uppercase">ou question directe</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Action 2: WhatsApp direct */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl border border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Échanger via WhatsApp</span>
          </a>

          {/* Reassurance */}
          <div className="pt-3 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Contrat officiel établi directement par l’agence</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
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

      {/* Sticky Mobile Bar CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl z-40 sm:hidden flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-slate-500 block">Total estimé ({totalDays}j)</span>
          <span className="text-sm font-extrabold text-[#02306B]">{formatPrice(totalPrice)}</span>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex-1 py-3 px-4 rounded-xl bg-[#02306B] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md"
        >
          <span>Demander cette voiture</span>
        </button>
      </div>
    </div>
  );
}
