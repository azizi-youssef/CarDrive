'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Users,
} from 'lucide-react';

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#02306B] text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Programme Partenaires Nador</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Rejoignez le réseau des agences de location à Nador
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            Recevez des réservations directes de touristes et résidents marocains à l’étranger (MRE), digitalisez vos plannings et augmentez votre taux de rotation.
          </p>
        </div>

        {submitted ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-lg space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Demande d’adhésion envoyée !</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Merci <strong>{managerName}</strong>. Notre équipe locale à Nador va vérifier les informations de votre agence (<strong>{agencyName}</strong>) et vous contacter au <strong>{phone}</strong> sous 24h ouvrées pour activer votre espace gestionnaire.
            </p>
            <div className="pt-4">
              <Link
                href="/agency"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#02306B] text-white text-xs font-semibold shadow"
              >
                <span>Explorer la démo du dashboard agence</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Perks Info (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-base text-slate-900">
                  Pourquoi inscrire votre agence ?
                </h3>

                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#02306B] shrink-0 mt-0.5" />
                    <span><strong>Visibilité MRE & Touristes :</strong> Atteignez des milliers de clients cherchant un véhicule à l’Aéroport Al-Aroui ou à Nador.</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#02306B] shrink-0 mt-0.5" />
                    <span><strong>Réservations directes & WhatsApp :</strong> Vos prospects vous contactent directement avec la référence pré-remplie du véhicule.</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#02306B] shrink-0 mt-0.5" />
                    <span><strong>SaaS de gestion de flotte inclus :</strong> Calendrier des disponibilités, gestion des prix et suivi du chiffre d’affaires.</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#02306B] shrink-0 mt-0.5" />
                    <span><strong>Badge « Vérifié » :</strong> Renforcez la confiance des clients grâce à notre audit de conformité légale.</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-slate-700">
                <span className="font-bold text-[#02306B] block mb-1">
                  100% sans engagement initial
                </span>
                Rejoignez les 10 premières agences de Nador déjà partenaires sur CarDrive.
              </div>
            </div>

            {/* Right Registration Form (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
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
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#02306B]"
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
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#02306B]"
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
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#02306B]"
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
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#02306B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Taille approximative de votre flotte
                  </label>
                  <select
                    value={fleetSize}
                    onChange={(e) => setFleetSize(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer"
                  >
                    <option value="1-5 véhicules">1 à 5 véhicules</option>
                    <option value="5-15 véhicules">5 à 15 véhicules</option>
                    <option value="15-30 véhicules">15 à 30 véhicules</option>
                    <option value="30+ véhicules">Plus de 30 véhicules</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#02306B] hover:bg-[#064181] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                  >
                    Envoyer ma demande de partenariat
                  </button>
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
