'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { VehicleCard, VehicleCardSkeleton } from '@/components/cars/VehicleCard';
import { SearchBar } from '@/components/search/SearchBar';
import {
  ALL_CATEGORIES,
  CatalogFilters,
  DEFAULT_FILTERS,
  FUEL_LABELS,
  PRICE_CEILING,
  TRANSMISSION_LABELS,
  countActiveFilters,
  type CatalogFilterState,
} from '@/components/search/CatalogFilters';
import { apiFetch } from '@/lib/api/client';
import { formatLocalDate, getEffectiveRentalDates } from '@/lib/utils/date-only';
import { useRealtimeRefresh } from '@/lib/supabase/realtime';
import { formatNumber } from '@/lib/utils';
import type { Vehicle, Agency } from '@/types';
import {
  AlertTriangle,
  ArrowUpDown,
  CalendarDays,
  Car,
  ChevronRight,
  MapPin,
  RefreshCw,
  SlidersHorizontal,
  X,
} from 'lucide-react';

type SortOption = 'price_asc' | 'price_desc' | 'rating' | 'featured';

const SORT_LABELS: Record<SortOption, string> = {
  featured: 'Recommandés',
  price_asc: 'Prix croissant',
  price_desc: 'Prix décroissant',
  rating: 'Meilleures agences',
};

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function formatDisplayDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

function SearchPageContent() {
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get('category') || ALL_CATEGORIES;
  const initialBrand = searchParams.get('brand') || 'ALL';
  const initialStartDate = searchParams.get('startDate') || '';
  const initialEndDate = searchParams.get('endDate') || '';
  const initialLocation = searchParams.get('location') || '';

  const [filters, setFilters] = useState<CatalogFilterState>({
    ...DEFAULT_FILTERS,
    category: initialCategory,
    brand: initialBrand,
  });
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [searchPeriod, setSearchPeriod] = useState({
    startDate: initialStartDate,
    endDate: initialEndDate,
  });
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehiclesError, setVehiclesError] = useState<string | null>(null);

  const updateFilters = useCallback((patch: Partial<CatalogFilterState>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const loadData = useCallback(async (isInitial = false) => {
    // Le chargement initial doit toujours aboutir, même dans un onglet ouvert en arrière-plan.
    if (!isInitial && document.visibilityState !== 'visible') return;
    if (isInitial) setVehiclesLoading(true);
    try {
      const params = new URLSearchParams();
      const period =
        initialStartDate && initialEndDate
          ? getEffectiveRentalDates(
              initialStartDate,
              initialEndDate,
              formatLocalDate(new Date())
            )
          : { startDate: '', endDate: '' };
      if (period.startDate && period.endDate) {
        params.set('startDate', period.startDate);
        params.set('endDate', period.endDate);
      }
      const query = params.size ? `?${params.toString()}` : '';
      const vehiclesRes = await apiFetch<Vehicle[]>(`/api/vehicles${query}`, {
        cache: 'no-store',
      });
      if (!vehiclesRes.success || !vehiclesRes.data) {
        throw new Error(vehiclesRes.error || 'Impossible de vérifier les disponibilités.');
      }
      setAllVehicles(vehiclesRes.data);
      setSearchPeriod(period);
      setVehiclesError(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Impossible de vérifier les disponibilités.';
      console.error('[SearchPage] Vehicle availability lookup failed:', message);
      setVehiclesError(message);
    } finally {
      if (isInitial) setVehiclesLoading(false);
    }
  }, [initialStartDate, initialEndDate]);

  useEffect(() => {
    void loadData(true);
  }, [loadData]);

  // Rafraîchissement automatique en direct (Supabase Realtime + Multi-onglets + Focus)
  useRealtimeRefresh({
    tables: ['vehicles', 'bookings', 'vehicle_unavailability'],
    onRefresh: () => loadData(false),
    pollingIntervalMs: 20_000,
  });

  useEffect(() => {
    let isMounted = true;
    apiFetch<Agency[]>('/api/agencies')
      .then((response) => {
        if (isMounted && response.success && response.data) setAgencies(response.data);
      })
      .catch((error: unknown) => {
        console.error('[SearchPage] Agency lookup failed:', error);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Marques réellement présentes dans le catalogue
  const brands = useMemo(
    () => Array.from(new Set(allVehicles.map((v) => v.brand))).sort((a, b) => a.localeCompare(b, 'fr')),
    [allVehicles]
  );

  const filteredVehicles = useMemo(() => {
    let result = [...allVehicles];

    if (filters.category && filters.category !== ALL_CATEGORIES) {
      const normSelected = normalize(filters.category);
      result = result.filter((v) => normalize(v.category || '') === normSelected);
    }
    if (filters.transmission !== 'ALL') {
      result = result.filter((v) => v.transmission === filters.transmission);
    }
    if (filters.fuel !== 'ALL') {
      result = result.filter((v) => v.fuel === filters.fuel);
    }
    if (filters.brand !== 'ALL') {
      result = result.filter((v) => v.brand.toLowerCase() === filters.brand.toLowerCase());
    }
    if (filters.brandQuery.trim()) {
      const q = filters.brandQuery.trim().toLowerCase();
      result = result.filter(
        (v) => v.brand.toLowerCase().includes(q) || v.model.toLowerCase().includes(q)
      );
    }
    if (filters.agency !== 'ALL') {
      result = result.filter((v) => v.agency_id === filters.agency);
    }
    result = result.filter((v) => filters.maxPrice >= PRICE_CEILING || v.daily_price <= filters.maxPrice);

    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.daily_price - b.daily_price);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.daily_price - a.daily_price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.agency?.rating || 0) - (a.agency?.rating || 0));
    }

    return result;
  }, [allVehicles, filters, sortBy]);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSortBy('featured');
  }, []);

  const activeFilterCount = countActiveFilters(filters);
  const agencyName = agencies.find((agency) => agency.id === filters.agency)?.name;

  // Puces des filtres actifs, chacune retirable individuellement
  const activeChips: { key: string; label: string; clear: Partial<CatalogFilterState> }[] = [];
  if (filters.category !== ALL_CATEGORIES) {
    activeChips.push({ key: 'category', label: filters.category, clear: { category: ALL_CATEGORIES } });
  }
  if (filters.transmission !== 'ALL') {
    activeChips.push({ key: 'transmission', label: TRANSMISSION_LABELS[filters.transmission], clear: { transmission: 'ALL' } });
  }
  if (filters.fuel !== 'ALL') {
    activeChips.push({ key: 'fuel', label: FUEL_LABELS[filters.fuel], clear: { fuel: 'ALL' } });
  }
  if (filters.brand !== 'ALL') {
    activeChips.push({ key: 'brand', label: filters.brand, clear: { brand: 'ALL' } });
  }
  if (filters.brandQuery.trim()) {
    activeChips.push({ key: 'brandQuery', label: `« ${filters.brandQuery.trim()} »`, clear: { brandQuery: '' } });
  }
  if (filters.agency !== 'ALL') {
    activeChips.push({ key: 'agency', label: agencyName ?? 'Agence', clear: { agency: 'ALL' } });
  }
  if (filters.maxPrice < PRICE_CEILING) {
    activeChips.push({ key: 'price', label: `≤ ${formatNumber(filters.maxPrice)} MAD/jour`, clear: { maxPrice: PRICE_CEILING } });
  }

  const hasPeriod = Boolean(searchPeriod.startDate && searchPeriod.endDate);
  const locationLabel = initialLocation || 'Nador et sa région';

  return (
    <div className="min-h-screen bg-[#F5F6F8] pb-20">
      {/* ── En-tête graphite + recherche ─────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0B1220] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:48px_48px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -end-24 -top-24 h-72 w-72 rounded-full bg-[#E63946]/20 blur-3xl"
        />
        <div className="relative mx-auto max-w-[1360px] px-4 pb-20 pt-7 sm:px-6 sm:pt-9 lg:px-8 lg:pb-24">
          <nav aria-label="Fil d’Ariane" className="mb-4 flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Link href="/" className="transition-colors hover:text-white">Accueil</Link>
            <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
            <span aria-current="page" className="text-slate-200">Véhicules</span>
          </nav>

          <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#E63946]">
            <span className="h-px w-6 bg-[#E63946]" aria-hidden="true" />
            Catalogue CarDrive
          </p>
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[44px]">
            Location de voiture à Nador
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0 text-[#E63946]" aria-hidden="true" />
              <span className="truncate">{locationLabel}</span>
            </span>
            {hasPeriod && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 shrink-0 text-[#E63946]" aria-hidden="true" />
                Du {formatDisplayDate(searchPeriod.startDate)} au {formatDisplayDate(searchPeriod.endDate)}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-14 max-w-[1360px] px-4 sm:px-6 lg:-mt-16 lg:px-8">
        <div className="rounded-2xl bg-white p-2 shadow-[0_18px_50px_-20px_rgba(11,18,32,0.35)] ring-1 ring-slate-200/70 sm:p-2.5">
          <SearchBar
            initialLocation={initialLocation || undefined}
            initialStartDate={initialStartDate}
            initialEndDate={initialEndDate}
            initialCategory={filters.category}
            initialBrand={filters.brand !== 'ALL' ? filters.brand : undefined}
            isCompact
          />
        </div>
      </div>

      {/* ── Barre de résultats ───────────────────────────────────────── */}
      <div className="mx-auto max-w-[1360px] px-4 pt-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[272px_minmax(0,1fr)] lg:gap-8">
          {/* Sidebar filtres (desktop) */}
          <aside className="hidden lg:block" aria-label="Filtres de recherche">
            <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(11,18,32,0.04)]">
              <CatalogFilters
                filters={filters}
                onChange={updateFilters}
                onReset={resetFilters}
                brands={brands}
                agencies={agencies}
              />
            </div>
          </aside>

          <section aria-labelledby="results-heading" className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 id="results-heading" className="text-lg font-extrabold text-[#0B1220] sm:text-xl">
                  {vehiclesLoading ? (
                    'Recherche des véhicules…'
                  ) : vehiclesError ? (
                    'Disponibilités non vérifiées'
                  ) : (
                    <>
                      {filteredVehicles.length} véhicule{filteredVehicles.length > 1 ? 's' : ''}
                      {hasPeriod ? ' disponible' + (filteredVehicles.length > 1 ? 's' : '') : ''}
                    </>
                  )}
                </h2>
                {!vehiclesLoading && !vehiclesError && (
                  <p className="mt-0.5 text-[13px] text-slate-500" aria-live="polite">
                    {hasPeriod
                      ? 'Disponibilité vérifiée pour vos dates auprès des agences partenaires.'
                      : 'Choisissez vos dates pour vérifier la disponibilité.'}
                  </p>
                )}
              </div>

              <div className="flex w-full items-center gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(true)}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-bold text-[#0B1220] shadow-[0_1px_2px_rgba(11,18,32,0.04)] transition-colors hover:border-slate-300 sm:flex-none lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  Filtres
                  {activeFilterCount > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E63946] px-1.5 text-[11px] text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <div className="relative flex-1 sm:flex-none">
                  <ArrowUpDown
                    className="pointer-events-none absolute start-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-slate-400 sm:block"
                    aria-hidden="true"
                  />
                  <label htmlFor="sort-select" className="sr-only">Trier par</label>
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pe-9 ps-3.5 text-[13px] font-bold text-[#0B1220] shadow-[0_1px_2px_rgba(11,18,32,0.04)] transition-colors hover:border-slate-300 focus:border-[#0B1220] focus:outline-none focus:ring-2 focus:ring-[#0B1220]/10 sm:w-56 sm:ps-9"
                  >
                    {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                      <option key={option} value={option}>
                        {SORT_LABELS[option]}
                      </option>
                    ))}
                  </select>
                  <ChevronRight
                    className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>

            {activeChips.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Filtres actifs">
                {activeChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => updateFilters(chip.clear)}
                    className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white pe-2 ps-3 text-xs font-semibold text-slate-700 transition-colors hover:border-[#E63946]/40 hover:text-[#E63946]"
                    aria-label={`Retirer le filtre ${chip.label}`}
                  >
                    <span className="truncate">{chip.label}</span>
                    <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={resetFilters}
                  className="h-8 px-2 text-xs font-bold text-[#E63946] hover:underline"
                >
                  Tout effacer
                </button>
              </div>
            )}

            {/* ── Résultats ─────────────────────────────────────────── */}
            <div className="mt-5">
              {vehiclesError ? (
                <div
                  role="alert"
                  className="flex flex-col items-start gap-4 rounded-2xl border border-red-200 bg-white p-6 sm:flex-row sm:items-center"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#E63946]">
                    <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#0B1220]">Impossible de charger les véhicules</p>
                    <p className="mt-0.5 text-sm text-slate-600">{vehiclesError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadData(true)}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0B1220] px-4 text-[13px] font-bold text-white transition-colors hover:bg-slate-800"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Réessayer
                  </button>
                </div>
              ) : vehiclesLoading ? (
                <div role="status" aria-label="Chargement des véhicules" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }, (_, i) => (
                    <VehicleCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredVehicles.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredVehicles.map((car, index) => (
                    <VehicleCard
                      key={car.id}
                      vehicle={car}
                      priority={index < 3}
                      availabilityChecked={Boolean(initialStartDate && initialEndDate)}
                    />
                  ))}
                </div>
              ) : (
                <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F6F8] text-[#0B1220]">
                    <Car className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-lg font-extrabold text-[#0B1220]">
                    Aucun véhicule ne correspond à votre recherche
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-500">
                    {allVehicles.length === 0
                      ? 'Aucun véhicule n’est disponible pour ces dates. Essayez une autre période.'
                      : 'Élargissez votre budget, changez de catégorie ou retirez certains filtres.'}
                  </p>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#0B1220] px-5 text-[13px] font-bold text-white transition-colors hover:bg-slate-800"
                    >
                      <RefreshCw className="h-4 w-4" aria-hidden="true" />
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        resultCount={filteredVehicles.length}
        activeCount={activeFilterCount}
        onReset={resetFilters}
      >
        <CatalogFilters
          filters={filters}
          onChange={updateFilters}
          onReset={resetFilters}
          brands={brands}
          agencies={agencies}
          hideHeader
        />
      </MobileFilterDrawer>
    </div>
  );
}

function MobileFilterDrawer({
  open,
  onClose,
  resultCount,
  activeCount,
  onReset,
  children,
}: {
  open: boolean;
  onClose: () => void;
  resultCount: number;
  activeCount: number;
  onReset: () => void;
  children: React.ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button
        type="button"
        aria-label="Fermer les filtres"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-[#0B1220]/55 backdrop-blur-[2px] motion-safe:animate-[cd-fade-in_150ms_ease-out]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-filters-title"
        className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-3xl bg-white shadow-2xl sm:inset-y-0 sm:end-0 sm:start-auto sm:max-h-none sm:w-[400px] sm:rounded-none"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h2 id="mobile-filters-title" className="text-base font-extrabold text-[#0B1220]">
            Filtres
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5">{children}</div>
        <div className="flex gap-3 border-t border-slate-100 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onReset}
            disabled={activeCount === 0}
            className="h-12 flex-1 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
          >
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-[1.4] rounded-xl bg-[#E63946] text-[13px] font-bold text-white transition-colors hover:bg-[#C92F3B]"
          >
            Voir {resultCount} véhicule{resultCount > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F6F8] p-8 text-center text-sm text-slate-500">
          Chargement des véhicules disponibles à Nador…
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
