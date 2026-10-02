'use client';

import React, { useState } from 'react';
import { AgencyCard } from '@/components/agencies/AgencyCard';
import { store } from '@/lib/services/store';
import { Building2, Search, ShieldCheck, MapPin } from 'lucide-react';

export default function AgenciesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const allAgencies = store.getAgencies();

  const filteredAgencies = allAgencies.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-teal-950/10 via-slate-50 to-white py-12 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#046c7a] text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>Réseau de confiance CarDrive</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Agences de location de voitures à Nador
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Retrouvez les meilleures agences partenaires locales vérifiées par notre équipe. 
            Prise en charge à l’aéroport Nador Al-Aroui, au port de Beni Ansar et en centre-ville.
          </p>

          {/* Quick Search */}
          <div className="mt-6 max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom d’agence ou quartier (ex: Aéroport, Marchica)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#046c7a] focus:ring-1 focus:ring-[#046c7a] shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Grid of Agencies */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {filteredAgencies.length} agence{filteredAgencies.length > 1 ? 's' : ''} partenaire{filteredAgencies.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgencies.map((agency) => (
            <AgencyCard
              key={agency.id}
              agency={agency}
              carCount={store.getVehicles({ agencyId: agency.id }).length}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
