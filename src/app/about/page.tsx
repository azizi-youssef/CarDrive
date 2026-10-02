import React from 'react';
import Link from 'next/link';
import {
  Car,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Users,
  Compass,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="bg-[#F8FAFC] min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Intro */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#046c7a] text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>À propos de CarDrive</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            La révolution de la location automobile à Nador
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Nous avons créé CarDrive avec une obsession : supprimer la friction subie par les voyageurs et résidents cherchant un véhicule disponible auprès des agences de Nador.
          </p>
        </div>

        {/* Story & Problem statement */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-sm space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Notre Constat
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            À Nador, qu’on atterrisse à l’Aéroport Al-Aroui ou qu’on arrive par bateau au Port de Beni Ansar, louer un modèle spécifique (ex: un Dacia Duster pour les pistes ou une Clio récente pour la ville) nécessitait d’appeler 4 à 8 agences au hasard.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            Si la première agence n’avait plus le modèle en stock, le client devait recommencer toutes ses démarches depuis le début.
          </p>

          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200/80 text-xs sm:text-sm text-[#046c7a] font-semibold">
            « Ne cherchez plus une agence. Cherchez directement la voiture dont vous avez besoin. »
          </div>
        </div>

        {/* Key Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#046c7a] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">100% Agences Vérifiées</h3>
            <p className="text-xs text-slate-500">
              Chaque agence partenaire est auditée : immatriculation commerciale, flotte physique en règle et transparence tarifaire.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#046c7a] flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Moteur d’équivalence</h3>
            <p className="text-xs text-slate-500">
              Si le véhicule choisi est indisponible, notre algorithme identifie en une fraction de seconde le même modèle chez nos partenaires.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#046c7a] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Ancrage Local Fort</h3>
            <p className="text-xs text-slate-500">
              Conçu pour Nador, Selouane, Al-Aroui, Beni Ansar et la magnifique lagune Marchica avant notre extension nationale.
            </p>
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center pt-4">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#046c7a] hover:bg-[#03525d] text-white font-bold text-sm shadow-md transition-all"
          >
            <span>Explorer les véhicules disponibles</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
