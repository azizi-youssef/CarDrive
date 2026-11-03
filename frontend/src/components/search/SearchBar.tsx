'use client';

import React, { useId, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Car, Search, type LucideIcon } from 'lucide-react';
import { LOCATIONS_NADOR, CATEGORIES } from '@/lib/constants/catalog';
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
        'flex h-full min-w-0 flex-col justify-center rounded-xl border border-transparent bg-[#F5F6F8] px-3.5 py-2.5 transition-colors hover:bg-[#EEF0F3] focus-within:border-[#0B1220]/25 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0B1220]/10',
        className
      )}
    >
      <label
        htmlFor={id}
        className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500"
      >
        <Icon className="h-3.5 w-3.5 shrink-0 text-[#E63946]" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </label>
      {children}
    </div>
  );
}

// text-base on mobile prevents iOS Safari from automatically zooming in when focusing selects/inputs
const controlClass =
  'min-h-8 w-full min-w-0 cursor-pointer truncate bg-transparent text-base sm:text-sm font-bold text-[#0B1220] focus:outline-none';

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
  // Marque transmise telle quelle (aucun champ dédié dans le formulaire)
  const brand = initialBrand && initialBrand !== 'ALL' ? initialBrand : ALL_BRANDS_LABEL;

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
      setDateError(t.searchBar.dateError);
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
      <div
        className={cn(
          'grid grid-cols-2 gap-2',
          isCompact
            ? 'md:grid-cols-4 lg:grid-cols-[1.5fr_1fr_1fr_1.1fr_auto]'
            : 'rounded-2xl bg-white p-2 shadow-[0_28px_70px_-28px_rgba(0,0,0,0.6)] ring-1 ring-black/5 sm:rounded-3xl lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_auto]'
        )}
      >
        {/* Lieu : pleine largeur sur mobile */}
        <div className={cn('col-span-2 lg:col-span-1', isCompact && 'md:col-span-4')}>
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

        {/* Pas de champ Marque : le carrousel « Les grandes marques » et le catalogue s'en chargent.
            Une marque reçue en paramètre (catalogue) reste transmise dans l'URL. */}

        {/* Catégorie : pleine largeur sur mobile */}
        <div className={cn('col-span-2 lg:col-span-1', isCompact && 'md:col-span-2')}>
          <Field id={`${uid}-category`} label={t.searchBar.category} icon={Car}>
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
          className="col-span-2 lg:col-span-1 flex min-h-12 lg:h-auto items-center justify-center gap-2 rounded-xl bg-[#E63946] px-7 py-3.5 text-base lg:text-sm font-bold text-white transition hover:bg-[#C92F3B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1220] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
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
