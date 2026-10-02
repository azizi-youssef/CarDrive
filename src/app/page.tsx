import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SearchBar } from '@/components/search/SearchBar';
import { VehicleCard } from '@/components/cars/VehicleCard';
import { AgencyCard } from '@/components/agencies/AgencyCard';
import { store } from '@/lib/services/store';
import {
  ShieldCheck,
  Zap,
  MapPin,
  CheckCircle2,
  Car,
  Clock,
  ArrowRight,
  Sparkles,
  Building2,
  Users,
} from 'lucide-react';

export default function HomePage() {
  const featuredVehicles = store.getVehicles().slice(0, 6);
  const agencies = store.getAgencies().slice(0, 4);

  const categories = [
    { name: 'Économique', icon: '🚗', desc: 'Clio, Sandero dès 260 DH', count: 18 },
    { name: 'SUV', icon: '🚙', desc: 'Duster, Tucson dès 330 DH', count: 14 },
    { name: 'Berline', icon: '🚘', desc: 'Golf 8, confort voyage', count: 8 },
    { name: 'Luxe', icon: '✨', desc: 'Range Rover, AMG VIP', count: 6 },
    { name: 'Automatique', icon: '🕹️', desc: 'Boîte auto souple', count: 16 },
    { name: '7 places', icon: '🚐', desc: 'Familles & MRE (Jogger, Vito)', count: 5 },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-950/10 via-slate-50 to-white pt-10 sm:pt-16 pb-12 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-[#046c7a] text-xs font-semibold mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>La 1ère plateforme multi-agences à Nador</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Trouvez votre voiture à <span className="text-[#046c7a]">Nador</span>
            </h1>

            <p className="mt-4 text-base sm:text-xl text-slate-600 font-normal leading-relaxed">
              Comparez les véhicules disponibles en temps réel auprès des agences de location locales. 
              Si un modèle n’est pas disponible chez l’une, trouvez-le chez une autre.
            </p>

            {/* Quick trust metrics */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#046c7a]" />
                <span>10 agences vérifiées</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#046c7a]" />
                <span>Aéroport Al-Aroui & Port Beni Ansar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#046c7a]" />
                <span>Réservation directe & WhatsApp</span>
              </div>
            </div>
          </div>

          {/* Search Bar Widget */}
          <div className="relative z-20">
            <SearchBar />
          </div>

        </div>
      </section>

      {/* CATÉGORIES POPULAIRES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Explorer par catégorie
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Des citadines compactes aux 4x4 robustes pour sillonner la région de Nador
            </p>
          </div>
          <Link
            href="/search"
            className="text-xs sm:text-sm font-semibold text-[#046c7a] hover:underline flex items-center gap-1"
          >
            <span>Voir tous les types</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/search?category=${encodeURIComponent(cat.name)}`}
              className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-teal-300 card-hover flex flex-col justify-between group shadow-sm text-center"
            >
              <div className="text-3xl mb-3">{cat.icon}</div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#046c7a] transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  {cat.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* VÉHICULES POPULAIRES EN TEMPS RÉEL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Disponibilité en direct à Nador
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Véhicules les plus demandés
            </h2>
          </div>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#046c7a] bg-teal-50 hover:bg-teal-100 transition-colors"
          >
            <span>Afficher les {store.getVehicles().length} véhicules</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredVehicles.map((vehicle, index) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} priority={index < 2} />
          ))}
        </div>
      </section>

      {/* PROPOSITION DE VALEUR / LE PROBLÈME RÉSOLU */}
      <section className="bg-slate-900 text-white py-16 sm:py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/60 border border-teal-500/30 text-teal-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pourquoi utiliser CarDrive Nador ?</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Ne cherchez plus une agence. <br />
                <span className="text-teal-400">Cherchez directement votre voiture.</span>
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                À Nador, vous avez déjà passé 2 heures à appeler des agences pour trouver un Duster ou une Clio disponible pour vos dates de vacances ?
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-600/30 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white">Flottes centralisées en direct</h4>
                    <p className="text-xs text-slate-400">Accédez au catalogue consolidé de plus de 10 agences de Nador en une seule recherche.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-600/30 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white">Alternative immédiate en cas d’indisponibilité</h4>
                    <p className="text-xs text-slate-400">Si un véhicule est loué, le système vous affiche instantanément les mêmes modèles disponibles chez les autres agences.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-600/30 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white">Réservation simple & contact WhatsApp</h4>
                    <p className="text-xs text-slate-400">Message pré-formaté avec dates et référence unique envoyé directement au gérant.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors shadow-lg shadow-teal-500/20"
                >
                  <span>Trouver un véhicule maintenant</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Visual Simulation Card */}
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <span className="text-xs font-mono text-teal-400">Moteur d’équivalence CarDrive</span>
                <span className="text-[11px] bg-red-950 text-red-300 border border-red-800/50 px-2 py-0.5 rounded">
                  Modèle indisponible chez Agence A
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-slate-200">Dacia Duster 2025</h4>
                  <span className="text-xs text-slate-400">360 DH / jour</span>
                </div>
                <p className="text-xs text-red-400 font-medium">⚠️ Déjà réservé pour vos dates chez Nador Auto Rent</p>
              </div>

              <div className="p-4 rounded-xl bg-teal-950/60 border border-teal-700/60 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-teal-300 font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>3 Dacia Duster trouvés chez d’autres partenaires vérifiés :</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between items-center py-1 border-b border-teal-900/60">
                    <span>• Rif Car Luxury (Duster 2024 Diesel)</span>
                    <strong className="text-white">340 DH / jour (Disponible)</strong>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-teal-900/60">
                    <span>• Marchica Drive (Duster 2025 Auto)</span>
                    <strong className="text-white">380 DH / jour (Disponible)</strong>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>• Aéroport Nador Cars (Duster 2024)</span>
                    <strong className="text-white">330 DH / jour (Disponible)</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* AGENCES LOCALES VÉRIFIÉES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Agences partenaires à Nador
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Des professionnels certifiés, basés au centre-ville, à l’aéroport et sur la côte
            </p>
          </div>
          <Link
            href="/agencies"
            className="text-xs sm:text-sm font-semibold text-[#046c7a] hover:underline flex items-center gap-1"
          >
            <span>Voir les 10 agences</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {agencies.map((agency) => (
            <AgencyCard
              key={agency.id}
              agency={agency}
              carCount={store.getVehicles({ agencyId: agency.id }).length}
            />
          ))}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Comment ça fonctionne ?
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            La réservation automobile la plus simple et rapide du Rif et de l’Oriental
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center space-y-3 relative shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#046c7a] font-extrabold text-lg flex items-center justify-center mx-auto shadow-sm">
              1
            </div>
            <h3 className="font-bold text-lg text-slate-900">1. Recherchez</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sélectionnez vos dates d’arrivée à Nador (Aéroport Al-Aroui ou centre-ville) et le type de véhicule souhaité.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center space-y-3 relative shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#046c7a] font-extrabold text-lg flex items-center justify-center mx-auto shadow-sm">
              2
            </div>
            <h3 className="font-bold text-lg text-slate-900">2. Comparez</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Consultez les prix réels, les équipements, les cautions et les avis vérifiés de plusieurs agences concurrentes.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center space-y-3 relative shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#046c7a] font-extrabold text-lg flex items-center justify-center mx-auto shadow-sm">
              3
            </div>
            <h3 className="font-bold text-lg text-slate-900">3. Réservez</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Envoyez votre demande en un clic ou discutez directement sur WhatsApp avec le gérant de l’agence avec votre référence #NRD.
            </p>
          </div>
        </div>
      </section>

      {/* CTA AGENCES B2B */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#046c7a] to-[#0891b2] rounded-3xl p-8 sm:p-12 text-white shadow-xl shadow-teal-900/10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center lg:text-left">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full text-white">
              Espace Professionnels de Nador
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Vous êtes une agence de location de voitures ?
            </h2>
            <p className="text-sm text-teal-100 max-w-xl">
              Digitalisez votre flotte, recevez des réservations directes de MRE et touristes, et gérez vos plannings avec notre solution SaaS dédiée.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/agency/join"
              className="px-6 py-3.5 rounded-xl font-bold text-sm bg-white text-[#046c7a] hover:bg-teal-50 transition-all shadow-md text-center"
            >
              Rejoindre la plateforme
            </Link>
            <Link
              href="/agency"
              className="px-6 py-3.5 rounded-xl font-semibold text-sm border border-white/60 text-white hover:bg-white/10 transition-all text-center"
            >
              Accéder au dashboard
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
