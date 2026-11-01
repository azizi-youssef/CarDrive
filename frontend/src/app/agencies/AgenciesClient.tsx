'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AgencyCard } from '@/components/agencies/AgencyCard';
import { Building2, Search, ShieldCheck, MapPin, ArrowRight, X } from 'lucide-react';
import type { Agency } from '@/types';
import { ShinyText, Magnet, GsapReveal } from '@/components/ui/react-bits';

export function AgenciesClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allAgencies, setAllAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/agencies', { cache: 'no-store' })
      .then((r) => r.json())
      .then((res) => {
        if (active && res.success && Array.isArray(res.data)) {
          setAllAgencies(res.data);
        }
      })
      .catch((e) => console.warn('Agencies load error:', e))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filteredAgencies = allAgencies.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasQuery = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* ── Header ── */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

          {/* Eyebrow */}
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E63946]/10">
              <ShieldCheck className="h-4 w-4 text-[#E63946]" />
            </div>
            <ShinyText
              text="Réseau CarDrive · Nador & Oriental"
              className="text-xs font-bold uppercase tracking-widest text-slate-500"
            />
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Agences de location à Nador
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Découvrez les agences partenaires référencées sur CarDrive. Chaque agence a fourni
            son registre de commerce, son assurance RC et son inventaire de flotte avant d&apos;être
            listée. Comparez les offres et envoyez votre demande directement.
          </p>

          {/* What "verified" means */}
          <div className="mt-5 flex flex-wrap gap-2 text-[11px]">
            {[
              'Registre de commerce vérifié',
              'Assurance RC valide',
              'Flotte validée',
              'Coordonnées confirmées',
            ].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700"
              >
                <ShieldCheck className="h-3 w-3" />
                {item}
              </span>
            ))}
          </div>

          {/* Search */}
          <div className="relative mt-6 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, quartier, ville…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-[#E63946] focus:outline-none focus:ring-1 focus:ring-[#E63946]"
            />
            {hasQuery && (
              <button
                type="button"
                aria-label="Effacer la recherche"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 transition hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Count bar */}
        <div className="mb-6 flex items-center justify-between">
          {loading ? (
            <div className="skeleton h-4 w-48 rounded" />
          ) : (
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {hasQuery
                ? `${filteredAgencies.length} résultat${filteredAgencies.length !== 1 ? 's' : ''} pour « ${searchQuery} »`
                : `${allAgencies.length} agence${allAgencies.length !== 1 ? 's' : ''} partenaire${allAgencies.length !== 1 ? 's' : ''}`}
            </span>
          )}
        </div>

        {/* Skeleton loading */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton h-56 rounded-2xl" />
            ))}
          </div>
        )}

        {/* No results after search */}
        {!loading && hasQuery && filteredAgencies.length === 0 && (
          <div className="flex flex-col items-center gap-5 rounded-3xl border border-slate-200 bg-white py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Search className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <p className="font-bold text-slate-900">
                Aucune agence pour « {searchQuery} »
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Essayez un autre quartier, ville ou nom d&apos;agence.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" />
              Effacer la recherche
            </button>
          </div>
        )}

        {/* Empty platform state (no agencies at all) */}
        {!loading && !hasQuery && allAgencies.length === 0 && (
          <div className="flex flex-col items-center gap-6 rounded-3xl border border-slate-200 bg-white py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0B1220]/5">
              <Building2 className="h-7 w-7 text-[#0B1220]/40" />
            </div>
            <div className="max-w-sm">
              <p className="text-lg font-bold text-slate-900">
                Les agences arrivent bientôt
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                CarDrive est en cours de déploiement à Nador. Les premières agences
                partenaires seront listées ici dès leur validation.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-xl bg-[#E63946] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#C92F3B]"
              >
                <Search className="h-4 w-4" />
                Rechercher un véhicule
              </Link>
              <Link
                href="/agency/join"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Building2 className="h-4 w-4" />
                Inscrire mon agence
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {/* Pickup locations still useful even with no agencies */}
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {['Aéroport Nador-Al Aroui', 'Port Beni Ansar', 'Nador Centre', 'Marchica'].map((loc) => (
                <span key={loc} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600">
                  <MapPin className="h-3 w-3 text-[#E63946]" />
                  {loc}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Agency grid */}
        {!loading && filteredAgencies.length > 0 && (
          <GsapReveal stagger={0.06} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAgencies.map((agency) => (
              <AgencyCard
                key={agency.id}
                agency={agency}
                carCount={agency.vehicle_count ?? 0}
              />
            ))}
          </GsapReveal>
        )}

        {/* B2B invite — shown only when agencies are loaded */}
        {!loading && (
          <div className="mt-14 rounded-2xl border border-slate-200 bg-white p-6 sm:flex sm:items-center sm:justify-between sm:p-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-[#E63946]" />
                <span className="text-sm font-bold text-slate-900">Vous êtes une agence de location à Nador ?</span>
              </div>
              <p className="text-xs text-slate-500 max-w-lg">
                Inscription gratuite, espace de gestion inclus. Votre dossier est examiné
                et votre profil activé sous 24 h ouvrées.
              </p>
            </div>
            <Magnet strength={0.2} className="mt-5 shrink-0 sm:mt-0">
              <Link
                href="/agency/join"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0B1220] px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Rejoindre CarDrive
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Magnet>
          </div>
        )}
      </div>
    </div>
  );
}
