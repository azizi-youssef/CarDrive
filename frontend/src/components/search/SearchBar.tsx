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
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { cn } from '@/lib/utils';

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
  className,
  children,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-2.5 sm:gap-3 rounded-xl border border-slate-100 bg-white px-3 sm:px-4 py-2.5 sm:py-3 transition-colors focus-within:border-[#E63946]/50 focus-within:ring-2 focus-within:ring-[#E63946]/20 hover:border-slate-200',
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="mb-0.5 block text-[11px] sm:text-xs font-medium text-slate-500">
          {label}
        </label>
        {children}
      </div>
    </div>
  );
}

// text-base on mobile prevents iOS Safari from automatically zooming in when focusing selects/inputs
const controlClass =
  'w-full cursor-pointer truncate bg-transparent text-base sm:text-sm font-semibold text-slate-900 focus:outline-none';

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
  const { t } = useTranslation();

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
    setStartDate(value);
    setDateError('');
    if (isValidDateOnly(value)) {
      if (!isValidDateOnly(effectiveEndDate) || effectiveEndDate <= value) {
        setEndDate(addDateDays(value, 3));
      }
    }
  };

  const handleEndChange = (value: string) => {
    setEndDate(value);
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
      <div className="grid grid-cols-2 gap-1.5 sm:gap-1 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-1.5 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.1fr_1.1fr_auto]">
        {/* Lieu : pleine largeur sur mobile */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-1">
          <Field id={`${uid}-location`} label={t.searchBar.pickupLocation} icon={MapPin}>
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
        </div>

        {/* Date départ : côte à côte avec retour sur mobile */}
        <div className="col-span-1">
          <Field id={`${uid}-start`} label={t.searchBar.pickupDate} icon={Calendar}>
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
        </div>

        {/* Date retour : côte à côte avec départ sur mobile */}
        <div className="col-span-1">
          <Field id={`${uid}-end`} label={t.searchBar.dropoffDate} icon={Calendar}>
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
        </div>

        {/* Marque : côte à côte avec catégorie sur mobile */}
        <div className="col-span-1 sm:col-span-1 lg:col-span-1">
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
        </div>

        {/* Catégorie : côte à côte avec marque sur mobile */}
        <div className="col-span-1 sm:col-span-1 lg:col-span-1">
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
        </div>

        {/* Bouton Rechercher : grande surface tactile sur mobile */}
        <button
          type="submit"
          disabled={!today}
          className="col-span-2 lg:col-span-1 flex h-12 lg:h-auto items-center justify-center gap-2 rounded-xl bg-[#E63946] px-6 py-3.5 text-base lg:text-sm font-semibold text-white transition hover:bg-[#C92F3B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1220] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          {t.searchBar.searchBtn}
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
