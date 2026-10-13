'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VehicleCard } from '@/components/cars/VehicleCard';
import { AgencyLogo } from '@/components/agencies/AgencyLogo';
import { AgencyBanner } from '@/components/agencies/AgencyBanner';
import { Badge } from '@/components/ui/Badge';
import type { Agency, Vehicle } from '@/types';
import {
  MapPin,
  Phone,
  MessageSquare,
  Mail,
  Star,
  ShieldCheck,
  Car,
  ChevronRight,
  Clock,
} from 'lucide-react';

interface AgencyDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function AgencyDetailPage({ params }: AgencyDetailPageProps) {
  const resolvedParams = use(params);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    let active = true;
    let selectedAgencyId: string | null = null;
    let vehicleRefreshTimer: ReturnType<typeof setInterval> | undefined;
    let loadingVehicles = false;

    async function loadVehicles(agencyId: string) {
      if (!active || loadingVehicles || document.visibilityState !== 'visible') return;
      loadingVehicles = true;
      try {
        const response = await fetch(
          `/api/vehicles?agencyId=${encodeURIComponent(agencyId)}`,
          { cache: 'no-store' }
        ).then((r) => r.json());
        if (active && response.success && Array.isArray(response.data)) {
          setVehicles(response.data);
        }
      } catch (err) {
        console.warn('Error refreshing agency vehicles:', err);
      } finally {
        loadingVehicles = false;
      }
    }

    async function load() {
      try {
        const aRes = await fetch('/api/agencies', { cache: 'no-store' }).then((r) => r.json());
        if (!active) return;
        const found = aRes.success && Array.isArray(aRes.data)
          ? aRes.data.find((a: Agency) => a.slug === resolvedParams.slug)
          : null;
        if (!found) {
          setNotFoundState(true);
          return;
        }
        selectedAgencyId = found.id;
        setAgency(found);
        await loadVehicles(found.id);
        vehicleRefreshTimer = setInterval(() => void loadVehicles(found.id), 30_000);
      } catch (err) {
        console.warn('Error loading agency detail:', err);
        if (active) setNotFoundState(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    const refreshOnFocus = () => {
      if (selectedAgencyId) void loadVehicles(selectedAgencyId);
    };
    window.addEventListener('focus', refreshOnFocus);
    return () => {
      active = false;
      if (vehicleRefreshTimer) clearInterval(vehicleRefreshTimer);
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [resolvedParams.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3 text-slate-600">
        <div className="w-8 h-8 border-4 border-[#02306B] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Chargement des données de l’agence…</p>
      </div>
    );
  }

  if (notFoundState || !agency) {
    notFound();
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link href="/" className="hover:text-slate-900">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link href="/agencies" className="hover:text-slate-900">Agences</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold">{agency.name}</span>
          </nav>
        </div>
      </div>

      {/* Agency Header Banner */}
      <div className="relative h-48 sm:h-64 w-full bg-slate-900">
        <AgencyBanner
          name={agency.name}
          bannerUrl={agency.banner_url}
          priority
          sizes="100vw"
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-16 sm:-mt-20">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xl shadow-blue-950/5 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-20 h-20 rounded-2xl border-4 border-white bg-white overflow-hidden shadow-lg relative shrink-0">
                <AgencyLogo
                  slug={agency.slug}
                  name={agency.name}
                  logoUrl={agency.logo_url}
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {agency.name}
                  </h1>
                  {agency.verified && (
                    <Badge variant="verified" icon>Partenaire Vérifié</Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#02306B]" />
                    <span>{agency.address} ({agency.city})</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-amber-600 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{agency.rating.toFixed(1)}</span>
                    <span className="text-slate-400 font-normal">({agency.review_count} avis)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CarDrive Intermediation Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="#agency-fleet"
                className="px-4 py-2.5 rounded-xl bg-[#02306B] hover:bg-[#064181] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
              >
                <Car className="w-4 h-4 text-[#FF7300]" />
                <span>Voir les voitures disponibles</span>
              </a>

              <a
                href={`https://wa.me/212661987654?text=${encodeURIComponent(`Bonjour CarDrive, j'ai une question concernant l'agence partenaire ${agency.name} à ${agency.city}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl border border-emerald-500 hover:bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Conciergerie CarDrive</span>
              </a>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
            {agency.description}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Ouvert 7j/7 de 08:00 à 21:00</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Agence certifiée CarDrive (Réservation & caution sécurisées)</span>
            </div>
          </div>

        </div>

        {/* Agency Fleet Section */}
        <div id="agency-fleet" className="mt-12 scroll-mt-24">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Véhicules proposés par l’agence
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {vehicles.length} véhicule{vehicles.length > 1 ? 's' : ''} à découvrir
              </p>
            </div>
          </div>

          {vehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              Aucun véhicule disponible pour le moment chez cette agence.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
