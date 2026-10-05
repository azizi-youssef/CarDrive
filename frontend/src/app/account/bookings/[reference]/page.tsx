'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Booking, BookingEvent } from '@/types';
import { formatPrice } from '@/lib/utils';
import {
  Calendar,
  Clock,
  MapPin,
  CarFront,
  Download,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Phone,
  MessageSquare,
  ArrowLeft,
  ShieldCheck,
  FileText,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { MeetingPointBadge } from '@/components/booking/MeetingPointBadge';

interface BookingDetailPageProps {
  params: Promise<{ reference: string }>;
}

export default function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { reference } = use(params);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/bookings/${encodeURIComponent(reference)}`);
        const data = await res.json();
        if (data.success && data.booking) {
          setBooking(data.booking);
        } else {
          setError(data.error || 'Dossier de réservation introuvable');
        }
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la récupération du dossier');
      } finally {
        setLoading(false);
      }
    }

    fetchBooking();
  }, [reference]);

  if (loading) {
    return (
      <div className="bg-[#F8FAFC] min-h-screen py-16 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#02306B] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Chargement de votre dossier...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="bg-[#F8FAFC] min-h-screen py-16 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Dossier introuvable</h2>
          <p className="text-xs text-slate-500">
            Aucune demande ne correspond à la référence <strong>{reference}</strong>.
          </p>
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#02306B] text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à mon compte
          </Link>
        </div>
      </div>
    );
  }

  // Événements timeline
  const timelineSteps = [
    { key: 'REQUESTED', label: 'Demande créée', done: true },
    { key: 'PDF_READY', label: 'PDF de demande généré', done: true },
    { key: 'SENT', label: 'Transmise à l’agence', done: true },
    {
      key: 'AGENCY_REVIEW',
      label: 'Examen agence',
      current: booking.status === 'REQUESTED' || booking.status === 'UNDER_REVIEW' || booking.status === 'PENDING',
      done: booking.status === 'APPROVED' || booking.status === 'CONFIRMED' || booking.status === 'ACTIVE' || booking.status === 'COMPLETED',
    },
    {
      key: 'APPROVED',
      label: 'Réservation validée',
      done: booking.status === 'APPROVED' || booking.status === 'CONFIRMED' || booking.status === 'ACTIVE' || booking.status === 'COMPLETED',
    },
    {
      key: 'READY',
      label: 'Véhicule prêt',
      done: booking.status === 'READY_FOR_PICKUP' || booking.status === 'ACTIVE' || booking.status === 'COMPLETED',
    },
    {
      key: 'ACTIVE',
      label: 'Location en cours',
      done: booking.status === 'ACTIVE' || booking.status === 'COMPLETED',
    },
    {
      key: 'COMPLETED',
      label: 'Restitution effectuée',
      done: booking.status === 'COMPLETED',
    },
  ];

  const isConfirmed = ['CONFIRMED', 'APPROVED', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status);
  const conciergeUrl = `https://wa.me/212661987654?text=${encodeURIComponent(
    `Bonjour CarDrive Conciergerie, je souhaite un suivi sur mon dossier réf. ${booking.reference || booking.booking_ref} (${booking.vehicle?.brand} ${booking.vehicle?.model}).`
  )}`;
  const whatsappText = `Bonjour, je vous contacte concernant mon dossier CarDrive réf. ${booking.reference || booking.booking_ref} pour la ${booking.vehicle?.brand} ${booking.vehicle?.model}.`;
  const agencyPhone = booking.agency?.whatsapp || booking.agency?.phone || '+212600000000';
  const agencyWhatsappUrl = `https://wa.me/${agencyPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation retour */}
        <div className="flex items-center justify-between">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à mes réservations</span>
          </Link>

          <span className="text-xs text-slate-400 font-mono">
            {booking.reference || booking.booking_ref}
          </span>
        </div>

        {/* Hero Card Statut */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#02306B]">
                  Dossier CarDrive
                </span>
                {booking.status === 'APPROVED' || booking.status === 'CONFIRMED' ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    ✓ Validé par l’agence
                  </span>
                ) : booking.status === 'REJECTED' ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                    ✕ Demande refusée
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    ● En attente de validation agence
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                {booking.vehicle?.brand} {booking.vehicle?.model}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Proposé par <strong>{booking.agency?.name}</strong> • Référence : <span className="font-mono text-slate-800 font-bold">{booking.reference || booking.booking_ref}</span>
              </p>
            </div>

            {/* Actions PDF & Contact */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2 shrink-0">
              <a
                href={`/api/bookings/${encodeURIComponent(booking.reference || booking.booking_ref || '')}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <Download className="w-4 h-4 text-[#02306B]" />
                <span>PDF Demande</span>
              </a>

              <a
                href={isConfirmed ? agencyWhatsappUrl : conciergeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all ${
                  isConfirmed 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                    : 'bg-[#02306B] hover:bg-[#064181] text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>{isConfirmed ? 'Agence (Retrait clés)' : 'Conciergerie CarDrive'}</span>
              </a>
            </div>
          </div>

          {/* Timeline de progression */}
          <div className="pt-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Suivi en temps réel de votre demande
            </h2>

            <div className="relative">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {timelineSteps.slice(0, 4).map((step, idx) => (
                  <div
                    key={step.key}
                    className={`p-3 rounded-2xl border transition-all ${
                      step.done
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : step.current
                        ? 'bg-blue-50/80 border-blue-300 text-[#02306B] shadow-sm ring-2 ring-blue-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold mb-1">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                          step.done
                            ? 'bg-emerald-600 text-white'
                            : step.current
                            ? 'bg-[#02306B] text-white animate-pulse'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {step.done ? '✓' : idx + 1}
                      </span>
                      <span>{step.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {step.done ? 'Complété' : step.current ? 'En cours de traitement' : 'À venir'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Détails en 2 Colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Colonne Principale (Détails véhicule & dates) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Modalités de Location */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#02306B]" />
                <span>Modalités de la location</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Prise en charge</span>
                  <p className="font-bold text-slate-900">{booking.start_date} à {booking.pickup_time || '10:00'}</p>
                  <p className="text-slate-500 text-[11px] mt-1">{booking.pickup_location}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Restitution</span>
                  <p className="font-bold text-slate-900">{booking.end_date} à {booking.dropoff_time || '10:00'}</p>
                  <p className="text-slate-500 text-[11px] mt-1">{booking.dropoff_location}</p>
                </div>
              </div>

              {/* Point de rendez-vous avec logo et consignes */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Point de rendez-vous officiel sélectionné :
                </span>
                <MeetingPointBadge location={booking.pickup_location} showInstructions={true} />
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-slate-500">Durée totale calculée :</span>
                <span className="font-bold text-slate-900">{booking.total_days} jour(s)</span>
              </div>
            </div>

            {/* Informations Client */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                Coordonnées du conducteur
              </h3>
              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block">Nom & Prénom</span>
                  <span className="font-semibold">{booking.customer_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Téléphone</span>
                  <span className="font-semibold">{booking.customer_phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">N° CIN ou Passeport</span>
                  <span className="font-semibold text-slate-900">{booking.cin || 'Présenté sur place'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Permis de conduire</span>
                  <span className="font-semibold">{booking.license_number || 'Présenté sur place'}</span>
                </div>
              </div>
            </div>

            {/* Mention Légale Intermédiaire */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 flex gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-0.5">Rappel légal important :</strong>
                CarDrive n'est pas le loueur légal du véhicule mais l'intermédiaire technologique. Le contrat de location officiel, la vérification physique des documents et la remise des clés s'effectuent directement avec l'agence partenaire.
              </div>
            </div>

          </div>

          {/* Colonne Latérale (Finances & Agence) */}
          <div className="space-y-6">
            
            {/* Décomposition Financière */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                Ventilation financière
              </h3>

              <div className="flex justify-between text-slate-600">
                <span>Prix par jour</span>
                <span className="font-semibold text-slate-900">{formatPrice(booking.daily_price)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Durée ({booking.total_days} jours)</span>
                <span className="font-semibold text-slate-900">{formatPrice(booking.total_price)}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-extrabold text-[#02306B]">
                <span>Total location</span>
                <span>{formatPrice(booking.total_price)}</span>
              </div>

              <div className="pt-2 border-t border-dashed border-slate-200 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Commission CarDrive ({booking.commission_rate}%)</span>
                  <span className="font-bold">{formatPrice(booking.commission_amount)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Solde agence à la remise</span>
                  <span className="font-semibold">{formatPrice(booking.agency_amount)}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>Caution remboursable</span>
                  <span>{formatPrice(booking.deposit_amount)}</span>
                </div>
              </div>
            </div>

            {/* Coordonnées Agence / Prise en Charge */}
            {booking.agency && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#02306B]" />
                  <span>Agence partenaire</span>
                </h3>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{booking.agency.name}</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">{booking.agency.address}, {booking.agency.city}</p>
                </div>

                {isConfirmed ? (
                  <>
                    <div className="space-y-1 pt-1 text-slate-600 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                      <p className="text-[11px] text-emerald-800 font-semibold mb-1">
                        Réservation validée par l'agence
                      </p>
                      <p>Téléphone : <strong className="text-slate-900">{booking.agency.phone}</strong></p>
                      <p>WhatsApp : <strong className="text-slate-900">{booking.agency.whatsapp}</strong></p>
                    </div>

                    <a
                      href={agencyWhatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Contacter l'agence pour la prise des clés</span>
                    </a>
                  </>
                ) : (
                  <>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                      Votre demande est en cours de validation par l'agence. Les coordonnées directes de prise en charge vous seront débloquées dès confirmation officielle.
                    </div>

                    <a
                      href={conciergeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-[#02306B] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#064181] transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-[#FF7300]" />
                      <span>Conciergerie CarDrive (Suivi)</span>
                    </a>
                  </>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
