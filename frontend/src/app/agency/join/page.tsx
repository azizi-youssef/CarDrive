'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { SpotlightCard, ShinyText, Magnet } from '@/components/ui/react-bits';

export default function AgencyJoinPage() {
  const [submitted, setSubmitted] = useState(false);
  const [agencyName, setAgencyName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [fleetSize, setFleetSize] = useState('5-15 véhicules');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-[#0B1220] text-xs font-semibold mb-4 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#E63946]" />
            <ShinyText text="Programme Partenaires Nador" className="text-[#0B1220]" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1220] tracking-tight">
            Rejoignez le réseau des agences de location à Nador
          </h1>

          <p className="mt-3.5 text-sm leading-relaxed text-slate-600">
            Recevez des réservations directes de touristes et résidents marocains à l’étranger (MRE), digitalisez vos plannings et augmentez votre taux de rotation.
          </p>
        </div>

        {submitted ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xl shadow-slate-900/5 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-1 ring-emerald-200/80">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-[#0B1220]">Demande d’adhésion envoyée !</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Merci <strong>{managerName}</strong>. Notre équipe locale à Nador va vérifier les informations de votre agence (<strong>{agencyName}</strong>) et vous contacter au <strong>{phone}</strong> sous 24h ouvrées pour activer votre espace gestionnaire.
            </p>
            <div className="pt-4">
              <Link
                href="/agency"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B1220] hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <span>Explorer la démo du dashboard agence</span>
                <ArrowRight className="w-4 h-4 text-[#E63946]" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Perks Info (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <SpotlightCard className="p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-base text-[#0B1220]">
                  Pourquoi inscrire votre agence ?
                </h3>

                <div className="space-y-3.5 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Visibilité MRE & Touristes :</strong> Atteignez des milliers de clients cherchant un véhicule à l’Aéroport Al-Aroui ou à Nador.</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Réservations directes & WhatsApp :</strong> Vos prospects vous contactent directement avec la référence pré-remplie du véhicule.</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>SaaS de gestion de flotte inclus :</strong> Calendrier des disponibilités, gestion des prix et suivi du chiffre d’affaires.</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Badge « Vérifié » :</strong> Renforcez la confiance des clients grâce à notre audit de conformité légale.</span>
                  </div>
                </div>
              </SpotlightCard>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-700">
                <span className="font-bold text-[#0B1220] block mb-1">
                  100% sans engagement initial
                </span>
                Inscription gratuite. Notre équipe vérifie votre dossier et active votre espace sous 24 h ouvrées.
              </div>
            </div>

            {/* Right Registration Form (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-bold text-[#0B1220] mb-4 pb-2 border-b border-slate-100">
                Formulaire d’enregistrement agence
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nom commercial de l’agence *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Nador Prestige Rent"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0B1220] focus:ring-1 focus:ring-[#0B1220]/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nom du gérant / responsable *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Khalid El Idrissi"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0B1220] focus:ring-1 focus:ring-[#0B1220]/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Téléphone / WhatsApp pro *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+212 6..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0B1220] focus:ring-1 focus:ring-[#0B1220]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Adresse physique à Nador ou environs *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Boulevard Mohammed V, Nador"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0B1220] focus:ring-1 focus:ring-[#0B1220]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Taille approximative de votre flotte
                  </label>
                  <select
                    value={fleetSize}
                    onChange={(e) => setFleetSize(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer focus:border-[#0B1220] focus:ring-1 focus:ring-[#0B1220]/20 outline-none transition-all"
                  >
                    <option value="1-5 véhicules">1 à 5 véhicules</option>
                    <option value="5-15 véhicules">5 à 15 véhicules</option>
                    <option value="15-30 véhicules">15 à 30 véhicules</option>
                    <option value="30+ véhicules">Plus de 30 véhicules</option>
                  </select>
                </div>

                <div className="pt-2 text-center sm:text-left">
                  <Magnet strength={0.2} className="w-full">
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-[#E63946] hover:bg-[#C92F3B] text-white font-bold text-sm shadow-xs hover:shadow-[0_4px_16px_rgba(230,57,70,0.3)] transition-all cursor-pointer active:scale-[0.99]"
                    >
                      Envoyer ma demande de partenariat
                    </button>
                  </Magnet>
                </div>

                <p className="text-[11px] text-slate-400 text-center">
                  En soumettant ce formulaire, vous acceptez d’être contacté par l’équipe CarDrive Nador.
                </p>
              </form>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
