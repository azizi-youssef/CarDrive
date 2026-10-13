'use client';

import React, { useId, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Car, CarFront, Search, type LucideIcon } from 'lucide-react';
import { LOCATIONS_NADOR, CATEGORIES, POPULAR_BRANDS } from '@/lib/constants/catalog';
import {
  addDateDays,
  formatLocalDate,
  getEffectiveRentalDates,
  isValidDateOnly,
} from '@/lib/utils/date-only';

interface SearchBarProps {
  initialLocation?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  initialCategory?: string;
  initialBrand?: string;
  isCompact?: boolean;
}

const ALL_CATEGORIES_LABEL = 'Tous les types';
const ALL_BRANDS_LABEL = 'Toutes les marques';

function subscribeToLocalDateChange(onChange: () => void): () => void {
  const interval = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(interval);
}

function getLocalToday(): string {
  return formatLocalDate(new Date());
}

function getServerToday(): string {
  return '';
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
  initialBrand = ALL_BRANDS_LABEL,
  isCompact = false,
}: SearchBarProps) {
  const router = useRouter();
  const uid = useId();

  const today = useSyncExternalStore(
    subscribeToLocalDateChange,
    getLocalToday,
    getServerToday
  );
  const [location, setLocation] = useState(
    LOCATIONS_NADOR.includes(initialLocation) ? initialLocation : LOCATIONS_NADOR[0] ?? ''
  );
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [dateError, setDateError] = useState('');
  const [category, setCategory] = useState(
    CATEGORIES.includes(initialCategory) ? initialCategory : ALL_CATEGORIES_LABEL
  );
  const [brand, setBrand] = useState(
    initialBrand && initialBrand !== 'ALL' ? initialBrand : ALL_BRANDS_LABEL
  );

  const { startDate: effectiveStartDate, endDate: effectiveEndDate } =
    getEffectiveRentalDates(startDate, endDate, today);

  const handleStartChange = (value: string) => {
    const localToday = today || formatLocalDate(new Date());
    const nextStart = isValidDateOnly(value) && value >= localToday ? value : localToday;
    setStartDate(nextStart);
    if (
      !isValidDateOnly(effectiveEndDate) ||
      effectiveEndDate <= nextStart
    ) {
      setEndDate(addDateDays(nextStart, 1));
    }
    setDateError('');
  };

  const handleEndChange = (value: string) => {
    if (!value) {
      setEndDate('');
      return;
    }
    if (!isValidDateOnly(value)) return;
    setEndDate(
      value <= effectiveStartDate ? addDateDays(effectiveStartDate, 1) : value
    );
    setDateError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const localToday = today || formatLocalDate(new Date());
    if (
      !isValidDateOnly(effectiveStartDate) ||
      effectiveStartDate < localToday ||
      !isValidDateOnly(effectiveEndDate) ||
      effectiveEndDate <= effectiveStartDate
    ) {
      setDateError('Choisissez un départ à partir d’aujourd’hui et une date de retour ultérieure.');
      return;
    }

    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (effectiveStartDate) params.set('startDate', effectiveStartDate);
    if (effectiveEndDate) params.set('endDate', effectiveEndDate);
    if (category && category !== ALL_CATEGORIES_LABEL) params.set('category', category);
    if (brand && brand !== ALL_BRANDS_LABEL && brand !== 'ALL') params.set('brand', brand);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Rechercher une voiture de location"
      className={`w-full ${isCompact ? '' : 'mx-auto max-w-5xl'}`}
    >
      <div className="grid gap-1 rounded-2xl border border-slate-200/80 bg-white p-1.5 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.1fr_1.1fr_auto]">
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
            value={effectiveStartDate}
            min={today}
            disabled={!today}
            required
            onChange={(e) => handleStartChange(e.target.value)}
            className={controlClass}
          />
        </Field>

        <Field id={`${uid}-end`} label="Date de retour" icon={Calendar}>
          <input
            id={`${uid}-end`}
            type="date"
            value={effectiveEndDate}
            min={isValidDateOnly(effectiveStartDate) ? addDateDays(effectiveStartDate, 1) : today}
            disabled={!today}
            required
            onChange={(e) => handleEndChange(e.target.value)}
            className={controlClass}
          />
        </Field>

        <Field id={`${uid}-brand`} label="Marque" icon={CarFront}>
          <select
            id={`${uid}-brand`}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className={controlClass}
          >
            {POPULAR_BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
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
          disabled={!today}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#E63946] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#C92F3B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1220] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 lg:col-span-1"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          Rechercher
        </button>
      </div>
      {dateError && (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {dateError}
        </p>
      )}
    </form>
  );
}