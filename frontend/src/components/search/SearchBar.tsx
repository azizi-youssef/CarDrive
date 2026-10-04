'use client';

import React, { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Car, Search, type LucideIcon } from 'lucide-react';
import { LOCATIONS_NADOR, CATEGORIES } from '@/lib/services/mockData';

interface SearchBarProps {
  initialLocation?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  initialCategory?: string;
  isCompact?: boolean;
}

const ALL_CATEGORIES_LABEL = 'Tous les types';

/** Date locale au format YYYY-MM-DD (évite le décalage UTC de toISOString). */
function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function Field({
  id,
  label,
  icon: Icon,
  children,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-transparent bg-white px-4 py-3 transition-colors focus-within:border-[#E63946]/50 focus-within:ring-2 focus-within:ring-[#E63946]/20 hover:border-slate-200">
      <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="mb-0.5 block text-xs font-medium text-slate-500">
          {label}
        </label>
        {children}
      </div>
    </div>
  );
}

const controlClass =
  'w-full cursor-pointer truncate bg-transparent text-sm font-semibold text-slate-900 focus:outline-none';

export function SearchBar({
  initialLocation = 'Aéroport Nador Al-Aroui (NDR)',
  initialStartDate = '',
  initialEndDate = '',
  initialCategory = ALL_CATEGORIES_LABEL,
  isCompact = false,
}: SearchBarProps) {
  const router = useRouter();
  const uid = useId();

  const now = new Date();
  const today = toLocalISODate(now);
  const inThreeDays = toLocalISODate(addDays(now, 3));

  const [location, setLocation] = useState(
    LOCATIONS_NADOR.includes(initialLocation) ? initialLocation : LOCATIONS_NADOR[0] ?? ''
  );
  const [startDate, setStartDate] = useState(initialStartDate || today);
  const [endDate, setEndDate] = useState(initialEndDate || inThreeDays);
  const [category, setCategory] = useState(
    CATEGORIES.includes(initialCategory) ? initialCategory : ALL_CATEGORIES_LABEL
  );

  const handleStartChange = (value: string) => {
    setStartDate(value);
    if (value && endDate && value > endDate) setEndDate(value);
  };

  const handleEndChange = (value: string) => {
    setEndDate(value);
    if (value && startDate && value < startDate) setStartDate(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (category && category !== ALL_CATEGORIES_LABEL) params.set('category', category);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Rechercher une voiture de location"
      className={`w-full ${isCompact ? '' : 'mx-auto max-w-5xl'}`}
    >
      <div className="grid gap-1 rounded-2xl border border-slate-200/80 bg-white p-1.5 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
        <Field id={`${uid}-location`} label="Lieu de départ" icon={MapPin}>
          <select
            id={`${uid}-location`}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={controlClass}
          >
            {LOCATIONS_NADOR.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </Field>

        <Field id={`${uid}-start`} label="Date de départ" icon={Calendar}>
          <input
            id={`${uid}-start`}
            type="date"
            value={startDate}
            min={today}
            onChange={(e) => handleStartChange(e.target.value)}
            className={controlClass}
          />
        </Field>

        <Field id={`${uid}-end`} label="Date de retour" icon={Calendar}>
          <input
            id={`${uid}-end`}
            type="date"
            value={endDate}
            min={startDate || today}
            onChange={(e) => handleEndChange(e.target.value)}
            className={controlClass}
          />
        </Field>

        <Field id={`${uid}-category`} label="Catégorie" icon={Car}>
          <select
            id={`${uid}-category`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={controlClass}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </Field>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-xl bg-[#E63946] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#C92F3B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1220] active:scale-[0.98] sm:col-span-2 lg:col-span-1"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          Rechercher
        </button>
      </div>
    </form>
  );
}