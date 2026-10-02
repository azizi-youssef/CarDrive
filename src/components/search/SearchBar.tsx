'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Car, Search, ChevronDown } from 'lucide-react';
import { LOCATIONS_NADOR, CATEGORIES } from '@/lib/services/mockData';

interface SearchBarProps {
  initialLocation?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  initialCategory?: string;
  isCompact?: boolean;
}

export function SearchBar({
  initialLocation = 'Aéroport Nador Al-Aroui (NDR)',
  initialStartDate = '',
  initialEndDate = '',
  initialCategory = 'Tous les types',
  isCompact = false,
}: SearchBarProps) {
  const router = useRouter();

  // Dates defaults: today + 3 days if not specified
  const today = new Date().toISOString().split('T')[0];
  const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [location, setLocation] = useState(initialLocation);
  const [startDate, setStartDate] = useState(initialStartDate || today);
  const [endDate, setEndDate] = useState(initialEndDate || inThreeDays);
  const [category, setCategory] = useState(initialCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (category && category !== 'Tous les types') params.set('category', category);

    router.push(`/search?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full bg-white rounded-2xl shadow-xl shadow-teal-950/5 border border-slate-200/80 p-3 sm:p-4 transition-all ${
        isCompact ? 'max-w-5xl' : 'max-w-5xl mx-auto'
      }`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-center">
        
        {/* Lieu de prise en charge */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-teal-200 bg-slate-50/50 hover:bg-white transition-all">
          <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-[#046c7a] shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Lieu de départ
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none truncate cursor-pointer"
            >
              {LOCATIONS_NADOR.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date de départ */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-teal-200 bg-slate-50/50 hover:bg-white transition-all">
          <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-[#046c7a] shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Date de départ
            </label>
            <input
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value > endDate) setEndDate(e.target.value);
              }}
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Date de retour */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-teal-200 bg-slate-50/50 hover:bg-white transition-all">
          <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-[#046c7a] shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Date de retour
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate || today}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Catégorie & CTA */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 hover:border-teal-200 bg-slate-50/50 hover:bg-white transition-all">
            <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-[#046c7a] shrink-0">
              <Car className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Catégorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none truncate cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="h-14 px-5 rounded-xl bg-[#046c7a] hover:bg-[#03525d] text-white flex items-center justify-center gap-2 font-semibold shadow-md shadow-teal-900/20 hover:shadow-lg transition-all shrink-0 cursor-pointer"
          >
            <Search className="w-5 h-5" />
            <span className="hidden xl:inline text-sm">Rechercher</span>
          </button>
        </div>

      </div>
    </form>
  );
}
