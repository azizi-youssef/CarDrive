'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { VehicleCard } from '@/components/cars/VehicleCard';
import { SearchBar } from '@/components/search/SearchBar';
import { store } from '@/lib/services/store';
import { CATEGORIES } from '@/lib/services/mockData';
import { Filter, SlidersHorizontal, ArrowUpDown, X, Car, RefreshCw, Check } from 'lucide-react';

function SearchPageContent() {
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get('category') || 'Tous les types';
  const initialStartDate = searchParams.get('startDate') || '';
  const initialEndDate = searchParams.get('endDate') || '';
  const initialLocation = searchParams.get('location') || '';

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedTransmission, setSelectedTransmission] = useState<string>('ALL');
  const [selectedFuel, setSelectedFuel] = useState<string>('ALL');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [selectedAgency, setSelectedAgency] = useState<string>('ALL');
  const [maxPrice, setMaxPrice] = useState<number>(1500);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'rating' | 'featured'>('featured');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const agencies = useMemo(() => store.getAgencies(), []);

  // Compute available brands
  const brands = useMemo(() => {
    const list = store.getVehicles().map((v) => v.brand);
    return ['ALL', ...Array.from(new Set(list))];
  }, []);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    let result = store.getVehicles({
      category: selectedCategory,
      startDate: initialStartDate,
      endDate: initialEndDate,
    });

    if (selectedTransmission !== 'ALL') {
      result = result.filter((v) => v.transmission === selectedTransmission);
    }

    if (selectedFuel !== 'ALL') {
      result = result.filter((v) => v.fuel === selectedFuel);
    }

    if (selectedBrand !== 'ALL') {
      result = result.filter((v) => v.brand.toLowerCase() === selectedBrand.toLowerCase());
    }

    if (selectedAgency !== 'ALL') {
      result = result.filter((v) => v.agency_id === selectedAgency);
    }

    result = result.filter((v) => v.daily_price <= maxPrice);

    // Sorting
    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.daily_price - b.daily_price);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.daily_price - a.daily_price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.agency?.rating || 0) - (a.agency?.rating || 0));
    }

    return result;
  }, [
    selectedCategory,
    selectedTransmission,
    selectedFuel,
    selectedBrand,
    selectedAgency,
    maxPrice,
    sortBy,
    initialStartDate,
    initialEndDate,
  ]);

  const resetFilters = () => {
    setSelectedCategory('Tous les types');
    setSelectedTransmission('ALL');
    setSelectedFuel('ALL');
    setSelectedBrand('ALL');
    setSelectedAgency('ALL');
    setMaxPrice(1500);
    setSortBy('featured');
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      
      {/* Top Search Bar bar */}
      <div className="bg-white border-b border-slate-200 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchBar
            initialLocation={initialLocation || undefined}
            initialStartDate={initialStartDate}
            initialEndDate={initialEndDate}
            initialCategory={selectedCategory}
            isCompact
          />
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Location de voiture à Nador
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              <strong>{filteredVehicles.length}</strong> véhicule{filteredVehicles.length > 1 ? 's' : ''} trouvé{filteredVehicles.length > 1 ? 's' : ''} disponible{filteredVehicles.length > 1 ? 's' : ''}
              {initialStartDate && initialEndDate && (
                <span> pour la période du {initialStartDate} au {initialEndDate}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#046c7a]" />
              <span>Filtres</span>
            </button>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs shadow-sm">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <label htmlFor="sort-select" className="text-slate-500 font-medium">Trier par :</label>
              <select
                id="sort-select"
                aria-label="Trier par"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="featured">Recommandés</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="rating">Meilleures notes agences</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2-Columns Layout: Filters Sidebar + Results */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* DESKTOP FILTERS SIDEBAR */}
          <aside className="hidden lg:block bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-6 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <SlidersHorizontal className="w-4 h-4 text-[#046c7a]" />
                <span>Filtres de recherche</span>
              </div>
              <button
                onClick={resetFilters}
                className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Effacer
              </button>
            </div>

            {/* Prix maximum */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-2">
                <span>Budget max / jour</span>
                <span className="text-[#046c7a] font-bold">{maxPrice} DH</span>
              </div>
              <input
                type="range"
                min="200"
                max="1500"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#046c7a] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>200 DH</span>
                <span>1500+ DH</span>
              </div>
            </div>

            {/* Catégories */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Catégorie
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {CATEGORIES.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 cursor-pointer py-0.5"
                  >
                    <input
                      type="radio"
                      name="cat_radio"
                      checked={selectedCategory === cat}
                      onChange={() => setSelectedCategory(cat)}
                      className="accent-[#046c7a]"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Transmission */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Boîte de vitesse
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedTransmission('ALL')}
                  className={`py-1.5 px-2 rounded-lg font-medium border text-center transition-colors ${
                    selectedTransmission === 'ALL'
                      ? 'bg-teal-50 border-teal-300 text-[#046c7a] font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Toutes
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTransmission('AUTOMATIC')}
                  className={`py-1.5 px-2 rounded-lg font-medium border text-center transition-colors ${
                    selectedTransmission === 'AUTOMATIC'
                      ? 'bg-teal-50 border-teal-300 text-[#046c7a] font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Automatique
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTransmission('MANUAL')}
                  className={`py-1.5 px-2 rounded-lg font-medium border text-center transition-colors col-span-2 ${
                    selectedTransmission === 'MANUAL'
                      ? 'bg-teal-50 border-teal-300 text-[#046c7a] font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Manuelle
                </button>
              </div>
            </div>

            {/* Carburant */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Carburant
              </h4>
              <select
                value={selectedFuel}
                onChange={(e) => setSelectedFuel(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 font-medium text-slate-800 bg-white"
              >
                <option value="ALL">Tous les carburants</option>
                <option value="DIESEL">Diesel</option>
                <option value="GASOLINE">Essence</option>
                <option value="HYBRID">Hybride</option>
              </select>
            </div>

            {/* Marque */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Marque
              </h4>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 font-medium text-slate-800 bg-white"
              >
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b === 'ALL' ? 'Toutes les marques' : b}
                  </option>
                ))}
              </select>
            </div>

            {/* Agence */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Agence de location
              </h4>
              <select
                value={selectedAgency}
                onChange={(e) => setSelectedAgency(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 font-medium text-slate-800 bg-white"
              >
                <option value="ALL">Toutes les agences</option>
                {agencies.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

          </aside>

          {/* RESULTS GRID */}
          <main className="lg:col-span-3">
            {filteredVehicles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVehicles.map((car, index) => (
                  <VehicleCard key={car.id} vehicle={car} priority={index < 4} />
                ))}
              </div>
            ) : (
              /* EMPTY STATE */
              <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#046c7a] flex items-center justify-center mx-auto">
                  <Car className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Aucune voiture ne correspond à vos filtres
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Essayez d’élargir vos dates, d’augmenter le budget maximum ou de sélectionner une autre catégorie.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={resetFilters}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#046c7a] hover:bg-[#03525d] text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    Réinitialiser les filtres
                  </button>
                  <button
                    onClick={() => setSelectedCategory('Tous les types')}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
                  >
                    Voir toutes les catégories
                  </button>
                </div>
              </div>
            )}
          </main>

        </div>
      </div>

      {/* MOBILE FILTER DRAWER */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden flex justify-end">
          <div className="w-full max-w-sm bg-white h-full p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900">Filtres de recherche</h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Budget */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-2">
                  <span>Budget max / jour</span>
                  <span className="text-[#046c7a] font-bold">{maxPrice} DH</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="1500"
                  step="50"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#046c7a]"
                />
              </div>

              {/* Catégories */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Catégorie
                </h4>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`p-2 rounded-lg text-left border ${
                        selectedCategory === cat
                          ? 'border-teal-500 bg-teal-50 font-bold text-[#046c7a]'
                          : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transmission */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Boîte de vitesse
                </h4>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {['ALL', 'AUTOMATIC', 'MANUAL'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSelectedTransmission(mode)}
                      className={`p-2 rounded-lg text-center border ${
                        selectedTransmission === mode
                          ? 'border-teal-500 bg-teal-50 font-bold text-[#046c7a]'
                          : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      {mode === 'ALL' ? 'Toutes' : mode === 'AUTOMATIC' ? 'Auto' : 'Manuelle'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={resetFilters}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Réinitialiser
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-3 rounded-xl bg-[#046c7a] text-white text-xs font-semibold shadow"
              >
                Appliquer ({filteredVehicles.length})
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Chargement des véhicules disponibles à Nador...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
