'use client';

import React, { useState } from 'react';
import { Booking, Vehicle } from '@/types';
import { formatPrice } from '@/lib/utils';
import { store } from '@/lib/services/store';
import {
  X,
  CheckCircle2,
  XCircle,
  CarFront,
  Download,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  User,
  ArrowRight,
  AlertCircle,
  FileText,
  Repeat,
  MessageSquare,
} from 'lucide-react';
import { MeetingPointBadge } from '@/components/booking/MeetingPointBadge';

interface AgencyBookingDetailModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export function AgencyBookingDetailModal({
  booking,
  isOpen,
  onClose,
  onStatusUpdated,
}: AgencyBookingDetailModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showAlternativeForm, setShowAlternativeForm] = useState(false);
  const [selectedAlternativeId, setSelectedAlternativeId] = useState('');
  const [alternativeNotes, setAlternativeNotes] = useState('');

  if (!isOpen || !booking) return null;

  // Véhicules de la même agence disponibles en alternative
  const agencyVehicles = store
    .getVehicles({ agencyId: booking.agency_id })
    .filter((v) => v.id !== booking.vehicle_id);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(booking.reference || booking.booking_ref || '')}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (res.ok) {
        onStatusUpdated();
        onClose();
      } else {
        alert('Erreur lors de l’acceptation');
      }
    } catch (err) {
      alert('Erreur réseau');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(booking.reference || booking.booking_ref || '')}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: rejectReason }),
      });
      if (res.ok) {
        onStatusUpdated();
        onClose();
      } else {
        alert('Erreur lors du refus');
      }
    } catch (err) {
      alert('Erreur réseau');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProposeAlternative = async () => {
    if (!selectedAlternativeId) {
      alert('Veuillez sélectionner un véhicule de substitution');
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(booking.reference || booking.booking_ref || '')}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'propose_alternative',
          alternativeVehicleId: selectedAlternativeId,
          notes: alternativeNotes,
        }),
      });
      if (res.ok) {
        onStatusUpdated();
        onClose();
      } else {
        alert('Erreur lors de la proposition d’alternative');
      }
    } catch (err) {
      alert('Erreur réseau');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#02306B] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-200">
              <span className="font-mono">{booking.reference || booking.booking_ref}</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">{booking.status}</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Demande de réservation reçue
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/api/bookings/${encodeURIComponent(booking.reference || booking.booking_ref || '')}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-white/20"
              title="Télécharger la fiche PDF officielle"
            >
              <Download className="w-3.5 h-3.5 text-[#FF7300]" />
              <span className="hidden sm:inline">Télécharger PDF</span>
            </a>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow space-y-5 text-xs">
          
          {/* Section 1 : Client */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-200/70 pb-1.5">
              <User className="w-4 h-4 text-[#02306B]" />
              <span>Coordonnées Client</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 text-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 block">Nom & Prénom</span>
                <span className="font-bold text-slate-900">{booking.customer_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Téléphone / WhatsApp</span>
                <span className="font-semibold text-slate-900">{booking.customer_phone}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">N° CIN ou Passeport</span>
                <span className="font-bold text-slate-900">{booking.cin || 'Présenté sur place'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Permis & Email</span>
                <span>{booking.license_number || 'Présenté'} {booking.customer_email && !booking.customer_email.includes('@cardrive.ma') ? `• ${booking.customer_email}` : ''}</span>
              </div>
            </div>
          </div>

          {/* Section 2 : Véhicule & Location */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-200/70 pb-1.5">
              <CarFront className="w-4 h-4 text-[#02306B]" />
              <span>Véhicule & Période</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 text-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 block">Modèle demandé</span>
                <span className="font-bold text-slate-900">{booking.vehicle?.brand} {booking.vehicle?.model} ({booking.vehicle?.year})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Durée</span>
                <span className="font-bold text-[#02306B]">{booking.total_days} jour(s)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Prise en charge</span>
                <span>{booking.start_date} ({booking.pickup_time}) • {booking.pickup_location}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Restitution</span>
                <span>{booking.end_date} ({booking.dropoff_time}) • {booking.dropoff_location}</span>
              </div>
            </div>

            {/* Point de rendez-vous choisi avec logo et consignes d'accueil */}
            <div className="pt-2 border-t border-slate-200/70">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                Point de rendez-vous choisi par le client :
              </span>
              <MeetingPointBadge location={booking.pickup_location} showInstructions={true} />
            </div>

            {booking.flight_number && (
              <div className="pt-2 border-t border-slate-200 text-amber-900 bg-amber-50/50 p-2 rounded-lg">
                <strong>Vol arrivée :</strong> {booking.flight_number} (Atterrissage : {booking.flight_arrival_time || '—'})
              </div>
            )}
            {(booking.customer_notes || booking.notes) && (
              <div className="pt-2 border-t border-slate-200 text-slate-600 italic">
                Notes client : "{booking.customer_notes || booking.notes}"
              </div>
            )}
          </div>

          {/* Section 3 : Finances & Commission CarDrive */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
            <h3 className="font-bold text-[#02306B] text-xs uppercase tracking-wider border-b border-blue-200 pb-1.5">
              Ventilation Financière
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 bg-white rounded-xl border border-blue-100">
                <span className="text-[10px] text-slate-500 block">Montant Total</span>
                <span className="font-bold text-slate-900 text-sm">{formatPrice(booking.total_price)}</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-blue-100">
                <span className="text-[10px] text-emerald-600 font-semibold block">Net Agence (85%)</span>
                <span className="font-extrabold text-emerald-700 text-sm">{formatPrice(booking.agency_amount)}</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-blue-100">
                <span className="text-[10px] text-blue-600 font-semibold block">Com. CarDrive ({booking.commission_rate}%)</span>
                <span className="font-bold text-[#02306B] text-sm">{formatPrice(booking.commission_amount)}</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 text-center pt-1">
              Caution légale exigée à la remise : {formatPrice(booking.deposit_amount)}
            </p>
          </div>

          {/* PDF Téléchargeable */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#02306B]" />
              <div>
                <span className="font-bold text-slate-900 block">PDF Officiel de la demande</span>
                <span className="text-[10px] text-slate-500">Document A4 prêt à imprimer pour la remise des clés</span>
              </div>
            </div>
            <a
              href={`/api/bookings/${encodeURIComponent(booking.reference || booking.booking_ref || '')}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ouvrir PDF</span>
            </a>
          </div>

          {/* Formulaire Refus (si ouvert) */}
          {showRejectForm && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 space-y-2">
              <label className="font-bold text-red-900 block">Motif du refus :</label>
              <input
                type="text"
                placeholder="Ex: Véhicule actuellement en révision ou déjà réservé"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-red-300 text-slate-800 outline-none"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleReject}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Confirmer le refus
                </button>
              </div>
            </div>
          )}

          {/* Formulaire Alternative (si ouvert) */}
          {showAlternativeForm && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <label className="font-bold text-amber-900 block">Sélectionner un véhicule alternatif :</label>
              <select
                value={selectedAlternativeId}
                onChange={(e) => setSelectedAlternativeId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-amber-300 text-slate-800 outline-none"
              >
                <option value="">-- Choisir un véhicule de substitution --</option>
                {agencyVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} ({v.year}) - {formatPrice(v.daily_price)}/j
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Remarques pour le client sur cette alternative"
                value={alternativeNotes}
                onChange={(e) => setAlternativeNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-amber-300 text-slate-800 outline-none"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAlternativeForm(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleProposeAlternative}
                  className="px-4 py-1.5 rounded-lg bg-[#02306B] text-white font-bold"
                >
                  Proposer au client
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions Agence */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100"
          >
            Fermer
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {!showRejectForm && !showAlternativeForm && (
              <>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  className="px-3.5 py-2 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 font-bold text-xs flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Refuser</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAlternativeForm(true)}
                  className="px-3.5 py-2 rounded-xl border border-amber-400 text-amber-800 hover:bg-amber-50 font-bold text-xs flex items-center gap-1.5"
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Proposer alternative</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleApprove}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accepter la demande</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
