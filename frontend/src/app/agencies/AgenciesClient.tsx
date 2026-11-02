
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  ShieldCheck,
  MapPin,
  ArrowRight,
  X,
  RefreshCw,
  CarFront,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

import { AgencyCard } from '@/components/agencies/AgencyCard';
import type { Agency } from '@/types';
import { ShinyText, Magnet, GsapReveal } from '@/components/ui/react-bits';

type AgencyResponse = {
  success: boolean;
  data: Agency[];
};

type SortOption = 'name' | 'fleet';

function normalizeText(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();
}

export function AgenciesClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');

  const [allAgencies, setAllAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAgencies = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(false);

    try {
      const response = await fetch('/api/agencies', {
        cache: 'no-store',
        signal,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result: AgencyResponse = await response.json();

      if (!result.success || !Array.isArray(result.data)) {
        throw new Error('Invalid agencies response');
      }

      setAllAgencies(result.data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      console.error('Agencies loading error:', err);
      setError(true);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void fetchAgencies(controller.signal);

    return () => controller.abort();
  }, [fetchAgencies]);

  // Available cities from real agency data
  const cities = useMemo(() => {
    return Array.from(
      new Set(
        allAgencies
          .map((agency) => agency.city?.trim())
          .filter((city): city is string => Boolean(city))
      )
    ).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [allAgencies]);

  // Search and filtering
  const filteredAgencies = useMemo(() => {
    const query = normalizeText(searchQuery);

    const results = allAgencies.filter((agency) => {
      const matchesSearch =
        !query ||
        normalizeText(agency.name).includes(query) ||
        normalizeText(agency.address).includes(query) ||
        normalizeText(agency.city).includes(query);

      const matchesCity =
        cityFilter === 'all' ||
        normalizeText(agency.city) === normalizeText(cityFilter);

      return matchesSearch && matchesCity;
    });

    return [...results].sort((a, b) => {
      if (sortBy === 'fleet') {
        return (b.vehicle_count ?? 0) - (a.vehicle_count ?? 0);
      }

      return a.name.localeCompare(b.name, 'fr');
    });
  }, [allAgencies, searchQuery, cityFilter, sortBy]);

  const hasFilters = searchQuery.trim().length > 0 || cityFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setCityFilter('all');
  };

  const handleRetry = () => {
    void fetchAgencies();
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC]">

      {/* =========================================
          HERO SECTION
      ========================================= */}
      <section className="relative isolate overflow-hidden bg-[#0B1220] text-white">

        {/* Decorative background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -right-40 -top-40 h-125 w-125 rounded-full border border-white/4" />
          <div className="absolute -right-20 -top-20 h-87.5 w-87.5 rounded-full border border-white/5" />
          <div className="absolute right-0 top-0 h-full w-1/2 bg-linear-to-l from-[#E63946]/7 to-transparent" />
          <div className="absolute bottom-0 left-0 h-px w-full bg-linear-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-20 lg:px-8 lg:pt-24">

          {/* Eyebrow */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E63946]/30 bg-[#E63946]/10">
              <ShieldCheck className="h-4 w-4 text-[#E63946]" />
            </div>

            <div className="flex flex-col gap-0.5">
              <ShinyText
                text="CARDRIVE PARTNER NETWORK"
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300"
              />
              <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
                Nador & Oriental · Morocco
              </span>
            </div>
          </div>

          {/* Main heading */}
          <div className="max-w-3xl">
            <h1 className="text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Find your
              <span className="block text-[#E63946]">
                trusted rental agency.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
              Explore rental agencies across Nador and the Oriental region.
              Compare local partners and find the right vehicle for your journey.
            </p>
          </div>

          {/* Search bar */}
          <div className="mt-9 max-w-3xl rounded-2xl border border-white/10 bg-white/6 p-2 shadow-2xl backdrop-blur-md sm:flex sm:items-center">

            <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2">
              <Search className="h-5 w-5 shrink-0 text-[#E63946]" />

              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by agency, city or location..."
                aria-label="Search rental agencies"
                className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="rounded-full p-1 text-slate-400 transition hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Link
              href="/search"
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#E63946] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#C92F3B] sm:mt-0"
            >
              Explore vehicles
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Trust information */}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            {[
              'Partner network',
              'Agency information',
              'Local coverage',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#E63946]" />
                <span className="text-xs font-medium text-slate-400">
                  {item}
                </span>
              </div>
            ))}
          </div>

          {/* Dynamic statistics */}
          <div className="mt-12 grid max-w-3xl grid-cols-2 gap-4 border-t border-white/10 pt-7 sm:grid-cols-3">

            <div>
              <p className="text-3xl font-black tracking-tight text-white">
                {loading ? '—' : allAgencies.length}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Partner agencies
              </p>
            </div>

            <div>
              <p className="text-3xl font-black tracking-tight text-white">
                {loading
                  ? '—'
                  : allAgencies.reduce(
                    (total, agency) => total + (agency.vehicle_count ?? 0),
                    0
                  )}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Listed vehicles
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className="text-3xl font-black tracking-tight text-[#E63946]">
                NDR
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Local network
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================
          AGENCY DIRECTORY
      ========================================= */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">

        {/* Section heading */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1 w-7 rounded-full bg-[#E63946]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E63946]">
                Discover our partners
              </span>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-[#0B1220] sm:text-3xl">
              Rental agencies
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Discover local rental professionals and explore their available fleets.
            </p>
          </div>

          {!loading && !error && (
            <div className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 sm:self-auto">
              <Building2 className="h-4 w-4 text-[#E63946]" />
              <span className="text-sm font-bold tabular-nums text-[#0B1220]">
                {filteredAgencies.length}
              </span>
              <span className="text-xs text-slate-500">
                {filteredAgencies.length === 1 ? 'Agency' : 'Agencies'}
              </span>
            </div>
          )}
        </div>

        {/* Filters */}
        {!loading && !error && allAgencies.length > 0 && (
          <div className="mb-7 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">
                Refine your search
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              {/* City filter */}
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                aria-label="Filter agencies by city"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-[#E63946]"
              >
                <option value="all">All cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>

              {/* Sorting */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort agencies"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-[#E63946]"
              >
                <option value="name">Name: A to Z</option>
                <option value="fleet">Largest fleet</option>
              </select>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#E63946] transition hover:bg-red-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        {/* =====================================
            LOADING STATE
        ===================================== */}
        {loading && (
          <div
            className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
            aria-label="Loading agencies"
          >
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="skeleton h-36 w-full" />
                <div className="space-y-4 p-5">
                  <div className="skeleton h-5 w-2/3 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                  <div className="skeleton h-3 w-3/4 rounded" />
                  <div className="skeleton h-10 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* =====================================
            ERROR STATE
        ===================================== */}
        {!loading && error && (
          <div className="rounded-3xl border border-red-100 bg-white px-6 py-16 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <AlertCircle className="h-6 w-6 text-[#E63946]" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-[#0B1220]">
              Unable to load agencies
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              We could not retrieve the agency directory. Please check your connection and try again.
            </p>

            <button
              type="button"
              onClick={handleRetry}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0B1220] px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        )}

        {/* =====================================
            EMPTY PLATFORM STATE
        ===================================== */}
        {!loading && !error && allAgencies.length === 0 && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">

            <div className="relative flex flex-col items-center px-6 py-16 text-center sm:py-20">

              <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[#E63946]/4 blur-3xl" />

              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0B1220]">
                <Building2 className="h-7 w-7 text-white" />
              </div>

              <span className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[#E63946]">
                Coming soon
              </span>

              <h3 className="mt-3 text-xl font-black text-[#0B1220] sm:text-2xl">
                Our network is growing.
              </h3>

              <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
                We are preparing our partner network in Nador and the Oriental region.
                New rental agencies will appear here as they join the platform.
              </p>

              <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">

                <Link
                  href="/search"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E63946] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#C92F3B]"
                >
                  <CarFront className="h-4 w-4" />
                  Explore vehicles
                </Link>

                <Link
                  href="/agency/join"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-[#0B1220] transition hover:bg-slate-50"
                >
                  Register your agency
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Local locations */}
              <div className="mt-12 border-t border-slate-100 pt-7">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Our target coverage
                </p>

                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    'Nador-Al Aroui Airport',
                    'Port Beni Ansar',
                    'Nador Centre',
                    'Marchica',
                  ].map((location) => (
                    <span
                      key={location}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-600"
                    >
                      <MapPin className="h-3 w-3 text-[#E63946]" />
                      {location}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================
            NO SEARCH RESULTS
        ===================================== */}
        {!loading &&
          !error &&
          allAgencies.length > 0 &&
          filteredAgencies.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Search className="h-6 w-6 text-slate-400" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-[#0B1220]">
                No agencies found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try another agency name, city or location.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-[#0B1220] transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                Clear filters
              </button>
            </div>
          )}

        {/* =====================================
            AGENCY GRID
        ===================================== */}
        {!loading && !error && filteredAgencies.length > 0 && (
          <GsapReveal
            stagger={0.06}
            className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredAgencies.map((agency) => (
              <AgencyCard
                key={agency.id}
                agency={agency}
                carCount={agency.vehicle_count ?? 0}
              />
            ))}
          </GsapReveal>
        )}

        {/* =====================================
            B2B PARTNER SECTION
        ===================================== */}
        {!loading && !error && (
          <section className="relative mt-16 overflow-hidden rounded-3xl bg-[#0B1220] p-7 text-white sm:p-10 lg:p-12">

            {/* Decorative element */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-40 border-white/3"
            />

            <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">

              <div className="max-w-xl">
                <div className="mb-4 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#E63946]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E63946]">
                    Business partnership
                  </span>
                </div>

                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                  Grow your rental business with CarDrive.
                </h2>

                <p className="mt-4 text-sm leading-7 text-slate-400">
                  Join our local automotive network, showcase your fleet
                  and manage your agency through a dedicated digital space.
                </p>
              </div>

              <Magnet strength={0.15} className="shrink-0">
                <Link
                  href="/agency/join"
                  className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#E63946] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#C92F3B] sm:w-auto"
                >
                  Become a partner
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Magnet>
            </div>
          </section>
        )}

        {/* Bottom navigation */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/search"
            className="group inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-[#E63946]"
          >
            Discover available vehicles
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

      </section>
    </main>
  );
}
