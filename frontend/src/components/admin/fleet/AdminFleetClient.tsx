'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Car, RefreshCw } from 'lucide-react';
import type { Vehicle } from '@/types';
import {
  AdminCard, TableWrapper, Th, Td, TableSkeletonRows,
  EmptyState, Pagination, SearchInput, SelectFilter, Btn, ErrorBanner, StatusBadge,
} from '@/components/admin/AdminUI';
import { useRealtimeRefresh } from '@/lib/supabase/realtime';

const PAGE_SIZE = 20;
const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'Toutes catégories' },
  { value: 'Économique', label: 'Économique' },
  { value: 'SUV', label: 'SUV' },
  { value: 'Berline', label: 'Berline' },
  { value: 'Luxe', label: 'Luxe' },
  { value: '7 places', label: '7 places' },
  { value: 'Automatique', label: 'Automatique' },
];

export function AdminFleetClient() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [page, setPage] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    if (mode === 'initial') setLoading(true); else setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/vehicles?onlyPublished=false&limit=500', { cache: 'no-store' });
      const body = await res.json();
      if (!ctrl.signal.aborted) setVehicles(body.data ?? body.vehicles ?? []);
    } catch (err) {
      if (!ctrl.signal.aborted) setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      if (!ctrl.signal.aborted) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  useEffect(() => { void load('initial'); return () => abortRef.current?.abort(); }, [load]);

  // Rafraîchissement automatique en direct de la flotte
  useRealtimeRefresh({
    tables: ['vehicles'],
    onRefresh: () => load('refresh'),
    pollingIntervalMs: 20_000,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (category !== 'ALL' && v.category !== category) return false;
      if (!q) return true;
      return (
        `${v.brand} ${v.model}`.toLowerCase().includes(q) ||
        (v.agency?.name ?? '').toLowerCase().includes(q) ||
        (v.license_plate ?? '').toLowerCase().includes(q)
      );
    });
  }, [vehicles, search, category]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page]);
  useEffect(() => setPage(0), [search, category]);

  const vehicleStatusVariant = (s: string) =>
    s === 'AVAILABLE' ? 'success' : s === 'RENTED' ? 'error' : s === 'MAINTENANCE' ? 'warning' : 'neutral';
  const vehicleStatusLabel = (s: string) =>
    s === 'AVAILABLE' ? 'Disponible' : s === 'RENTED' ? 'Loué' : s === 'MAINTENANCE' ? 'Entretien' : s === 'BLOCKED' ? 'Bloqué' : s;

  return (
    <div className="space-y-5">
      {error && <ErrorBanner message={error} onRetry={() => void load('refresh')} retrying={refreshing} />}
      <AdminCard noPadding>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5 border-b border-slate-100">
          <SearchInput value={search} onChange={setSearch} placeholder="Marque, modèle, agence, plaque…" className="flex-1" />
          <div className="flex items-center gap-2">
            <SelectFilter value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
            <Btn variant="secondary" size="sm" onClick={() => void load('refresh')} disabled={refreshing}>
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </Btn>
          </div>
        </div>
        <TableWrapper>
          <thead className="bg-slate-50">
            <tr>
              <Th>Véhicule</Th>
              <Th className="hidden sm:table-cell">Catégorie</Th>
              <Th className="hidden md:table-cell">Agence</Th>
              <Th className="hidden lg:table-cell">Prix/jour</Th>
              <Th className="hidden xl:table-cell">Plaque</Th>
              <Th>Statut</Th>
              <Th className="hidden sm:table-cell">Publié</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? <TableSkeletonRows cols={7} rows={8} /> :
              paginated.length === 0 ? (
                <tr><td colSpan={7} className="py-0">
                  <EmptyState icon={Car} title="Aucun véhicule" description="Aucun résultat pour ces filtres." />
                </td></tr>
              ) : paginated.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <Td>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{v.brand} {v.model}</p>
                      <p className="text-xs text-slate-500">{v.year} · {v.transmission === 'AUTOMATIC' ? 'Auto' : 'Manuelle'}</p>
                    </div>
                  </Td>
                  <Td className="hidden sm:table-cell"><span className="text-xs text-slate-600">{v.category}</span></Td>
                  <Td className="hidden md:table-cell"><span className="text-sm text-slate-700 truncate max-w-[140px] block">{v.agency?.name ?? '—'}</span></Td>
                  <Td className="hidden lg:table-cell"><span className="text-sm font-semibold tabular-nums text-slate-900">{v.daily_price} DH</span></Td>
                  <Td className="hidden xl:table-cell"><span className="font-mono text-xs text-slate-500">{v.license_plate ?? '—'}</span></Td>
                  <Td><StatusBadge variant={vehicleStatusVariant(v.status) as any}>{vehicleStatusLabel(v.status)}</StatusBadge></Td>
                  <Td className="hidden sm:table-cell">
                    <span className={`text-xs font-medium ${v.published ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {v.published ? '✓ Oui' : '— Non'}
                    </span>
                  </Td>
                </tr>
              ))
            }
          </tbody>
        </TableWrapper>
        <div className="px-5 pb-4 sm:px-6">
          <Pagination page={page} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE}
            onPrev={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          />
        </div>
      </AdminCard>
    </div>
  );
}
