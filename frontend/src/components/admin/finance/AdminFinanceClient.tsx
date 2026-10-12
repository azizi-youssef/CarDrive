'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { DollarSign, RefreshCw, Download, Settings } from 'lucide-react';
import type { Booking } from '@/types';
import {
  AdminCard, KpiCard, SectionHeader, TableWrapper, Th, Td, TableSkeletonRows,
  BookingStatusBadge, EmptyState, Pagination, SearchInput, Btn, ErrorBanner,
} from '@/components/admin/AdminUI';
import { fetchAdminBookings } from '@/lib/api/admin-dashboard.api';
import { formatPrice } from '@/lib/utils';

const PAGE_SIZE = 20;

interface Props { commissionRate: number }

function csvExport(rows: Booking[]) {
  const header = ['Dossier', 'Client', 'Agence', 'Début', 'Fin', 'Total', 'Commission', 'Net agence', 'Statut'];
  const lines = rows.map((b) => [
    b.booking_ref ?? b.reference ?? '',
    b.customer_name,
    b.agency?.name ?? '',
    b.start_date, b.end_date,
    b.total_price, b.commission_amount, b.agency_amount, b.status,
  ].map((v) => { const s = String(v ?? ''); return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(';'));
  const blob = new Blob(['\uFEFF' + [header.join(';'), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cardrive-commissions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminFinanceClient({ commissionRate }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    if (mode === 'initial') setLoading(true); else setRefreshing(true);
    setError(null);
    try {
      const data = await fetchAdminBookings();
      if (!ctrl.signal.aborted) setBookings(data);
    } catch (err) {
      if (!ctrl.signal.aborted) setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      if (!ctrl.signal.aborted) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  useEffect(() => { void load('initial'); return () => abortRef.current?.abort(); }, [load]);

  // Only COMPLETED or CONFIRMED bookings are financially realized
  const realized = useMemo(() =>
    bookings.filter((b) => ['COMPLETED', 'CONFIRMED', 'APPROVED', 'ACTIVE'].includes(b.status)),
    [bookings]
  );
  const pending = useMemo(() =>
    bookings.filter((b) => ['PENDING', 'REQUESTED', 'UNDER_REVIEW'].includes(b.status)),
    [bookings]
  );

  const totalVolume = useMemo(() => realized.reduce((s, b) => s + (b.total_price ?? 0), 0), [realized]);
  const totalCommission = useMemo(() => realized.reduce((s, b) => s + (b.commission_amount ?? 0), 0), [realized]);
  const totalNet = useMemo(() => realized.reduce((s, b) => s + (b.agency_amount ?? 0), 0), [realized]);
  const pendingVolume = useMemo(() => pending.reduce((s, b) => s + (b.total_price ?? 0), 0), [pending]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) =>
      (b.booking_ref ?? b.reference ?? '').toLowerCase().includes(q) ||
      b.customer_name.toLowerCase().includes(q) ||
      (b.agency?.name ?? '').toLowerCase().includes(q)
    );
  }, [bookings, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page]);
  useEffect(() => setPage(0), [search]);

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} onRetry={() => void load('refresh')} retrying={refreshing} />}

      {/* Commission rate banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 flex items-center gap-4">
        <Settings className="h-5 w-5 text-blue-600 shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-900">
            Taux de commission actuel : <span className="text-[#E63946]">{commissionRate}%</span>
          </p>
          <p className="text-xs text-blue-700 mt-0.5">
            Applicable sur le montant total de chaque réservation. Modifiable dans{' '}
            <Link href="/admin/settings" className="underline">Paramètres</Link>.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Volume réalisé" value={loading ? '—' : formatPrice(totalVolume)} sub="réservations actives/terminées" icon={DollarSign} iconColor="text-slate-600" loading={loading} />
        <KpiCard label="Commission CarDrive" value={loading ? '—' : formatPrice(totalCommission)} sub={`${commissionRate}% du volume`} icon={DollarSign} iconColor="text-[#E63946]" loading={loading} />
        <KpiCard label="Net agences" value={loading ? '—' : formatPrice(totalNet)} sub={`${100 - commissionRate}% du volume`} icon={DollarSign} iconColor="text-emerald-600" loading={loading} />
        <KpiCard label="Volume en attente" value={loading ? '—' : formatPrice(pendingVolume)} sub={`${pending.length} réservation(s)`} icon={DollarSign} iconColor="text-amber-500" loading={loading} />
      </div>

      {/* Definition note */}
      <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500">
        <strong>Définitions :</strong> Le <em>volume réalisé</em> comprend les réservations CONFIRMED, APPROVED, ACTIVE et COMPLETED.
        Le <em>volume en attente</em> comprend PENDING, REQUESTED et UNDER_REVIEW — non encore confirmé par l'agence.
        La commission est calculée à {commissionRate}% du total de chaque réservation.
      </div>

      {/* Table */}
      <AdminCard noPadding>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5 border-b border-slate-100">
          <SectionHeader title="Détail par réservation" />
          <div className="flex items-center gap-2 sm:ml-auto">
            <SearchInput value={search} onChange={setSearch} placeholder="Dossier, client, agence…" className="w-60" />
            <Btn variant="secondary" size="sm" onClick={() => void load('refresh')} disabled={refreshing}>
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </Btn>
            <Btn variant="secondary" size="sm" onClick={() => csvExport(filtered)} disabled={filtered.length === 0}>
              <Download className="h-3.5 w-3.5" />
              CSV
            </Btn>
          </div>
        </div>

        <TableWrapper>
          <thead className="bg-slate-50">
            <tr>
              <Th>Dossier</Th>
              <Th className="hidden md:table-cell">Agence</Th>
              <Th className="hidden lg:table-cell">Dates</Th>
              <Th>Total (DH)</Th>
              <Th>Commission</Th>
              <Th className="hidden sm:table-cell">Net agence</Th>
              <Th>Statut</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? <TableSkeletonRows cols={7} rows={8} /> :
              paginated.length === 0 ? (
                <tr><td colSpan={7} className="py-0">
                  <EmptyState icon={DollarSign} title="Aucune réservation" />
                </td></tr>
              ) : paginated.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <Td><span className="font-mono text-xs font-semibold text-slate-700">{b.booking_ref ?? b.reference ?? b.id.slice(0, 8)}</span></Td>
                  <Td className="hidden md:table-cell"><span className="text-sm text-slate-700 truncate max-w-[120px] block">{b.agency?.name ?? '—'}</span></Td>
                  <Td className="hidden lg:table-cell"><span className="text-xs text-slate-500 whitespace-nowrap">{b.start_date} → {b.end_date}</span></Td>
                  <Td><span className="text-sm font-bold tabular-nums text-slate-900">{formatPrice(b.total_price)}</span></Td>
                  <Td><span className="text-sm font-semibold tabular-nums text-[#E63946]">{formatPrice(b.commission_amount)}</span></Td>
                  <Td className="hidden sm:table-cell"><span className="text-sm tabular-nums text-emerald-700">{formatPrice(b.agency_amount)}</span></Td>
                  <Td><BookingStatusBadge status={b.status} /></Td>
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
