'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Vehicle } from '@/types';
import { calculateBookingPrice, calculateRentalDays } from '@/lib/utils/pricing';
import { formatPrice } from '@/lib/utils';
import { LOCATIONS_NADOR } from '@/lib/services/mockData';
import {
  X,
  User,
  Calendar,
  Sliders,
  CheckCircle2,
  FileText,
  Download,
  ShieldCheck,
  Plane,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Clock,
  CarFront,
  MessageSquare,
  Building2,
} from 'lucide-react';

interface BookingRequestModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
  defaultStartDate?: string;
  defaultEndDate?: string;
  defaultLocation?: string;
}

export function BookingRequestModal({
  vehicle,
  isOpen,
  onClose,
  defaultStartDate,
  defaultEndDate,
  defaultLocation,
}: BookingRequestModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Current Step: 1 (Infos), 2 (Location), 3 (Options), 4 (Récapitulatif), 5 (Confirmé)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [confirmedBookingRef, setConfirmedBookingRef] = useState<string | null>(null);  // Étape 1 : Coordonnées & Permis
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cin, setCin] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Maroc');
  const [birthDate, setBirthDate] = useState('1994-01-01');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('2032-01-01');

  // Étape 2 : Location
  const [startDate, setStartDate] = useState(defaultStartDate || today);
  const [endDate, setEndDate] = useState(defaultEndDate || inThreeDays);
  const [pickupTime, setPickupTime] = useState('10:00');
  const [dropoffTime, setDropoffTime] = useState('10:00');
  const [deliveryType, setDeliveryType] = useState<'AGENCY_PICKUP' | 'AIRPORT' | 'HOTEL' | 'ADDRESS'>('AIRPORT');
  const [pickupLocation, setPickupLocation] = useState(defaultLocation || 'Aéroport Nador Al-Aroui (NDR)');
  const [dropoffLocation, setDropoffLocation] = useState(defaultLocation || 'Aéroport Nador Al-Aroui (NDR)');

  // Étape 3 : Options & Notes
  const [flightNumber, setFlightNumber] = useState('');
  const [flightArrivalTime, setFlightArrivalTime] = useState('');
  const [childSeat, setChildSeat] = useState(false);
  const [additionalDriver, setAdditionalDriver] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');

  // Calculs financiers
  const totalDays = calculateRentalDays(startDate, endDate);
  const pricing = calculateBookingPrice(vehicle.daily_price, totalDays, 15.00);

  if (!isOpen) return null;

  // Validation Étape 1
  const validateStep1 = () => {
    if (!firstName.trim() || !lastName.trim()) {
      alert('Veuillez renseigner votre prénom et votre nom');
      return false;
    }
    if (!cin.trim()) {
      alert('Veuillez renseigner votre numéro de CIN ou Passeport');
      return false;
    }
    if (!phone.trim() || phone.length < 8) {
      alert('Veuillez renseigner un numéro de téléphone valide');
      return false;
    }
    if (!licenseNumber.trim()) {
      alert('Veuillez renseigner votre numéro de permis de conduire');
      return false;
    }
    return true;
  };

  // Validation Étape 2
  const validateStep2 = () => {
    if (new Date(endDate) < new Date(startDate)) {
      alert('La date de retour doit être postérieure ou égale à la date de début');
      return false;
    }
    return true;
  };

  // Soumission finale vers l'API
  const handleSubmitBookingRequest = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const payload = {
        vehicleId: vehicle.id,
        agencyId: vehicle.agency_id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        cin: cin.trim().toUpperCase(),
        email: email.trim() || `${phone.replace(/[^0-9]/g, '')}@cardrive.ma`,
        phone: phone.trim(),
        country,
        birthDate,
        licenseNumber: licenseNumber.trim(),
        licenseExpiry,
        startDate,
        endDate,
        pickupTime,
        dropoffTime,
        deliveryType,
        pickupLocation,
        dropoffLocation,
        flightNumber: flightNumber.trim() || undefined,
        flightArrivalTime: flightArrivalTime.trim() || undefined,
        childSeat,
        additionalDriver,
        customerNotes: customerNotes.trim() || undefined,
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la transmission de la demande');
      }

      setConfirmedBookingRef(data.reference);
      setCurrentStep(5); // Écran de confirmation
    } catch (err: any) {
      setSubmissionError(err.message || 'Une erreur est survenue lors de l’envoi de votre demande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header de la Modal */}
        <div className="bg-[#02306B] text-white px-6 py-4 flex items-center justify-between relative shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-200 uppercase tracking-wider">
              <span>CarDrive Marketplace</span>
              <span>•</span>
              <span className="text-[#FF7300] font-bold">Demande sans engagement</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Demander la {vehicle.brand} {vehicle.model}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar (Étapes 1 à 4) */}
        {currentStep < 5 && (
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 shrink-0">
            <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-bold">
              {[
                { num: 1, label: 'Vos coordonnées' },
                { num: 2, label: 'Votre location' },
                { num: 3, label: 'Options & notes' },
                { num: 4, label: 'Vérification' },
              ].map((s) => (
                <div
                  key={s.num}
                  className={`flex items-center justify-center gap-1.5 pb-1 border-b-2 transition-all ${
                    currentStep === s.num
                      ? 'border-[#02306B] text-[#02306B]'
                      : currentStep > s.num
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-slate-400'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      currentStep === s.num
                        ? 'bg-[#02306B] text-white'
                        : currentStep > s.num
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {currentStep > s.num ? '✓' : s.num}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contenu Déroulant */}
        <div className="p-6 overflow-y-auto flex-grow space-y-5">
          {submissionError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{submissionError}</span>
            </div>
          )}

          {/* ================= ÉTAPE 1 : COORDONNÉES CLIENT ================= */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">1. Vos informations personnelles & permis</h3>
                <p className="text-xs text-slate-500">
                  Ces éléments permettront à l'agence de vérifier l'éligibilité et de préparer votre dossier de réservation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Youssef"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#02306B] focus:ring-1 focus:ring-[#02306B] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Azizi"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#02306B] focus:ring-1 focus:ring-[#02306B] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">N° CIN ou Passeport *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: S123456 ou 12AB34567"
                    value={cin}
                    onChange={(e) => setCin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#02306B] focus:ring-1 focus:ring-[#02306B] outline-none uppercase font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email (facultatif)</label>
                  <input
                    type="email"
                    placeholder="exemple@domaine.com (optionnel)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#02306B] focus:ring-1 focus:ring-[#02306B] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Téléphone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+212 6..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#02306B] focus:ring-1 focus:ring-[#02306B] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pays de résidence *</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:border-[#02306B] outline-none"
                  >
                    <option value="Maroc">Maroc</option>
                    <option value="France">France</option>
                    <option value="Espagne">Espagne</option>
                    <option value="Belgique">Belgique</option>
                    <option value="Pays-Bas">Pays-Bas</option>
                    <option value="Allemagne">Allemagne</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date de naissance *</label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#02306B] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">N° de permis de conduire *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 04/123456"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#02306B] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiration du permis *</label>
                  <input
                    type="date"
                    required
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#02306B] outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-blue-900 text-[11px] flex gap-2">
                <ShieldCheck className="w-4 h-4 text-[#02306B] shrink-0 mt-0.5" />
                <span>
                  <strong>Protection de votre vie privée :</strong> CarDrive ne demande pas la photo de votre permis à cette étape. Les pièces justificatives physiques seront vérifiées directement par l'agence partenaire lors de la remise des clés.
                </span>
              </div>
            </div>
          )}

          {/* ================= ÉTAPE 2 : DATES & LOCATION ================= */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">2. Période & modalités de remise</h3>
                <p className="text-xs text-slate-500">
                  Précisez quand et où vous souhaitez récupérer et restituer le véhicule à Nador.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Prise en charge
                  </label>
                  <input
                    type="date"
                    min={today}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-900 outline-none"
                  />
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-900 mt-2 outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Restitution
                  </label>
                  <input
                    type="date"
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-900 outline-none"
                  />
                  <input
                    type="time"
                    value={dropoffTime}
                    onChange={(e) => setDropoffTime(e.target.value)}
                    className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-900 mt-2 outline-none"
                  />
                </div>
              </div>

              {/* Mode de livraison */}
              <div className="text-xs">
                <label className="block font-semibold text-slate-700 mb-1.5">Mode de récupération</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'AIRPORT', label: 'Aéroport Nador' },
                    { key: 'AGENCY_PICKUP', label: 'En agence' },
                    { key: 'HOTEL', label: 'Hôtel' },
                    { key: 'ADDRESS', label: 'Adresse ville' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setDeliveryType(item.key as any)}
                      className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                        deliveryType === item.key
                          ? 'border-[#02306B] bg-blue-50 text-[#02306B] font-bold shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lieu de prise en charge</label>
                  <select
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 outline-none"
                  >
                    {LOCATIONS_NADOR.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lieu de restitution</label>
                  <select
                    value={dropoffLocation}
                    onChange={(e) => setDropoffLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 outline-none"
                  >
                    {LOCATIONS_NADOR.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ================= ÉTAPE 3 : OPTIONS & NOTES ================= */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">3. Options de vol & demandes particulières</h3>
                <p className="text-xs text-slate-500">
                  Précisez les détails qui faciliteront votre accueil à l'arrivée.
                </p>
              </div>

              {deliveryType === 'AIRPORT' && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <Plane className="w-4 h-4 text-amber-700" />
                    <span>Accueil aéroport Nador Al-Aroui (NDR)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">N° de vol (facultatif)</label>
                      <input
                        type="text"
                        placeholder="Ex: RAM 234 ou Ryanair"
                        value={flightNumber}
                        onChange={(e) => setFlightNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Heure estimée d'atterrissage</label>
                      <input
                        type="time"
                        value={flightArrivalTime}
                        onChange={(e) => setFlightArrivalTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={childSeat}
                    onChange={(e) => setChildSeat(e.target.checked)}
                    className="w-4 h-4 accent-[#02306B]"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Siège enfant ou réhausseur</span>
                    <span className="text-[11px] text-slate-500">Mis à disposition par l'agence selon disponibilité</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={additionalDriver}
                    onChange={(e) => setAdditionalDriver(e.target.checked)}
                    className="w-4 h-4 accent-[#02306B]"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Conducteur supplémentaire</span>
                    <span className="text-[11px] text-slate-500">Ajout du second permis lors de la signature en agence</span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes ou remarques pour l'agence (facultatif)
                </label>
                <textarea
                  rows={3}
                  placeholder="Précisions sur vos horaires, bagages volumineux, etc."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-[#02306B]"
                />
              </div>
            </div>
          )}

          {/* ================= ÉTAPE 4 : RÉCAPITULATIF ================= */}
          {currentStep === 4 && (
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">4. Récapitulatif de votre demande de réservation</h3>
                <p className="text-xs text-slate-500">
                  Vérifiez attentivement les informations avant d'envoyer la demande à l'agence.
                </p>
              </div>

              {/* Résumé Véhicule & Client */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Véhicule demandé</span>
                  <p className="font-bold text-slate-900 text-sm">{vehicle.brand} {vehicle.model} ({vehicle.year})</p>
                  <p className="text-slate-500 text-[11px]">{vehicle.transmission === 'AUTOMATIC' ? 'Automatique' : 'Manuelle'} • {vehicle.fuel} • {vehicle.category}</p>
                  <p className="text-slate-600 font-medium text-[11px] mt-1">Agence : {vehicle.agency?.name}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Client demandeur</span>
                  <p className="font-bold text-slate-900 text-sm">{firstName} {lastName}</p>
                  <p className="text-slate-500 text-[11px]">{phone} • CIN : <strong className="text-slate-800">{cin}</strong></p>
                  <p className="text-slate-500 text-[11px]">Permis : {licenseNumber}{email ? ` • ${email}` : ''}</p>
                </div>
              </div>

              {/* Résumé Dates & Lieux */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/70">
                  <span className="font-semibold text-slate-700">Dates de location</span>
                  <span className="font-bold text-slate-900">{startDate} ({pickupTime}) → {endDate} ({dropoffTime})</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/70">
                  <span className="font-semibold text-slate-700">Lieu de prise / restitution</span>
                  <span className="font-medium text-slate-800 text-right">{pickupLocation}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">Durée calculée</span>
                  <span className="font-bold text-[#02306B]">{pricing.number_of_days} jour(s)</span>
                </div>
              </div>

              {/* Décomposition Financière CarDrive */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-white border border-blue-200/90 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Prix unitaire journalier</span>
                  <span className="font-semibold text-slate-900">{formatPrice(pricing.daily_price)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Sous-total ({pricing.number_of_days} jours)</span>
                  <span className="font-semibold text-slate-900">{formatPrice(pricing.subtotal)}</span>
                </div>

                <div className="pt-2 border-t border-blue-200 flex justify-between text-sm font-extrabold text-[#02306B]">
                  <span>Total estimé de la location</span>
                  <span>{formatPrice(pricing.total)}</span>
                </div>

                {/* Décomposition transparence 15% CarDrive / 85% Agence */}
                <div className="pt-2 border-t border-dashed border-blue-200 text-[11px] space-y-1">
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Frais de mise en relation & plateforme ({pricing.commission_rate}%)</span>
                    <span className="font-bold">{formatPrice(pricing.commission_amount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Solde agence partenaire à la remise</span>
                    <span className="font-semibold">{formatPrice(pricing.agency_amount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Caution remboursable exigée en agence</span>
                    <span>{formatPrice(vehicle.deposit || 3000)}</span>
                  </div>
                </div>
              </div>

              {/* Avertissement Juridique & Rôle CarDrive */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  CarDrive est l'intermédiaire technologique officiel
                </p>
                <p className="text-amber-800 leading-relaxed">
                  L'envoi de cette demande ne constitue pas un contrat de location immédiat. Le véhicule sera réservé dès acceptation formelle par l'agence locale <strong>{vehicle.agency?.name}</strong>, qui établira le contrat officiel lors de la remise des clés.
                </p>
              </div>
            </div>
          )}

          {/* ================= ÉTAPE 5 : CONFIRMATION & SUIVI ================= */}
          {currentStep === 5 && (
            <div className="py-4 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-950">
                  Votre demande a bien été envoyée !
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  L'agence partenaire examine actuellement votre dossier pour valider la disponibilité.
                </p>
              </div>

              {/* Dossier Référence Badge */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-sm mx-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Référence unique de dossier
                </span>
                <span className="font-mono text-lg font-black text-[#02306B] tracking-wider block">
                  {confirmedBookingRef || 'CD-2026-001842'}
                </span>
                <span className="inline-block mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  ● En attente de validation de l'agence
                </span>
              </div>

              {/* Actions Rapides */}
              <div className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto pt-2">
                <a
                  href={`/api/bookings/${encodeURIComponent(confirmedBookingRef || '')}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Download className="w-4 h-4 text-[#02306B]" />
                  <span>Télécharger le PDF</span>
                </a>

                <Link
                  href={`/account/bookings/${encodeURIComponent(confirmedBookingRef || '')}`}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#02306B] hover:bg-[#064181] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Clock className="w-4 h-4" />
                  <span>Suivre ma demande</span>
                </Link>
              </div>

              <div className="pt-2 text-xs text-slate-500">
                Vous recevrez une notification par email et WhatsApp dès que l'agence aura validé votre dossier.
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Buttons */}
        {currentStep < 5 && (
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Précédent</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1 && !validateStep1()) return;
                  if (currentStep === 2 && !validateStep2()) return;
                  setCurrentStep((prev) => prev + 1);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#02306B] hover:bg-[#064181] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <span>Continuer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitBookingRequest}
                className="px-6 py-3 rounded-xl bg-[#02306B] hover:bg-[#064181] disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-950/20 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Envoi en cours...</span>
                ) : (
                  <>
                    <CarFront className="w-4 h-4 text-[#FF7300]" />
                    <span>Envoyer ma demande de réservation</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
