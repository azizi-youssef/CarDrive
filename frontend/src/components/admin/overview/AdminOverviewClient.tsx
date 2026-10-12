'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Car,
  CalendarDays,
  DollarSign,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Download,
} from 'lucide-react';
import type { AdminStats } from '@/lib/api/stats.api';
import {
  KpiCard,
  AdminCard,
  SectionHeader,
  BookingStatusBadge,
  AgencyStatusBadge,
  Alert,
  Btn,
  ErrorBanner,
  EmptyState,
  Price,
} from '@/components/admin/AdminUI';
import {
  fetchAdminStats,
  fetchAdminBookings,
  fetchAdminAgencies,
  fetchCommissionRatePct,
  fetchHealth,
  patchAgencyVerification,
  type HealthReport,
} from '@/lib/api/admin-dashboard.api';
import type { Agency, Booking } from '@/types';
import { formatPrice } from '@/lib/utils';

interface Props {
  initialStats: AdminStats | null;
  statsError: string | null;
  commissionRate: number;
}

function csvExport(bookings: Booking[]) {
  const header = ['Dossier', 'Client', 'Véhicule', 'Agence', 'Début', 'Fin', 'Montant', 'Commission', 'Net agence', 'Statut'];
  const rows = bookings.map((b) =>
    [
      b.booking_ref ?? b.reference ?? '',
      b.customer_name,
      `${b.vehicle?.brand ?? ''} ${b.vehicle?.model ?? ''}`.trim(),
      b.agency?.name ?? '',
      b.start_date,
      b.end_date,
      b.total_price,
      b.commission_amount,
      b.agency_amount,
      b.status,
    ].map((v) => {
      const s = String(v ?? '');
      return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(';')
  );
  const blob = new Blob(['\uFEFF' + [header.join(';'), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cardrive-reservations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminOverviewClient({ initialStats, statsError, commissionRate: initialRate }: Props) {
  const [stats, setStats] = useState<AdminStats | null>(initialStats);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [commissionRate, setCommissionRate] = useState(initialRate);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(statsError);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [newStats, newBookings, newAgencies, ratePct, healthData] = await Promise.all([
        fetchAdminStats(),
        fetchAdminBookings(),
        fetchAdminAgencies(),
        fetchCommissionRatePct(),
        fetchHealth(),
      ]);
      if (ctrl.signal.aborted) return;
      setStats(newStats);
      setBookings(newBookings);
      setAgencies(newAgencies);
      if (ratePct != null) setCommissionRate(ratePct);
      setHealth(healthData);
      setLastRefresh(new Date());
    } catch (err) {
      if (ctrl.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      if (!ctrl.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void load('initial');
    return () => abortRef.current?.abort();
  }, [load]);

  const handleVerify = async (agency: Agency, verified: boolean) => {
    if (!verified && !window.confirm(`Révoquer la vérification de ${agency.name} ?`)) return;
    setVerifyingId(agency.id);
    try {
      await patchAgencyVerification(agency.id, { status: verified ? 'ACTIVE' : 'SUSPENDED', verified });
      showToast('success', verified ? `${agency.name} vérifiée.` : `Vérification révoquée.`);
      void load('refresh');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Erreur');
    } finally {
      setVerifyingId(null);
    }
  };

  // Derived
  const pendingBookings = bookings.filter((b) => ['PENDING', 'REQUESTED', 'UNDER_REVIEW'].includes(b.status)).length;
  const confirmedBookings = bookings.filter((b) => ['CONFIRMED', 'APPROVED', 'ACTIVE'].includes(b.status)).length;
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED').length;
  const pendingAgencies = agencies.filter((a) => a.status === 'PENDING' || !a.verified);
  const agencyNet = stats ? (stats.agencyNet ?? Math.max(0, stats.totalVolume - stats.platformCommission)) : 0;
  const commissionShare = stats?.totalVolume ? Math.min(100, Math.round((stats.platformCommission / stats.totalVolume) * 100)) : 0;

  const kpiLoading = loading;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-xl border px-5 py-3.5 shadow-lg text-sm font-medium ${
            toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Error */}
      {error && <ErrorBanner message={error} onRetry={() => void load('refresh')} retrying={refreshing} />}

      {/* Alert: pending agencies */}
      {!loading && pendingAgencies.length > 0 && (
        <Alert variant="warning" title={`${pendingAgencies.length} agence${pendingAgencies.length > 1 ? 's' : ''} en attente de vérification`} action={
          <Link href="/admin/agencies?filter=PENDING">
            <Btn variant="secondary" size="sm">Traiter maintenant</Btn>
          </Link>
        }>
          Vérifiez et activez les agences partenaires pour qu'elles puissent recevoir des réservations.
        </Alert>
      )}

      {/* Top actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div />
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs text-slate-500">
              Actualisé à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Btn variant="secondary" size="sm" onClick={() => void load('refresh')} disabled={refreshing}>
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            Actualiser
          </Btn>
          <Btn variant="secondary" size="sm" onClick={() => csvExport(bookings)} disabled={bookings.length === 0}>
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Exporter CSV
          </Btn>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Volume brut total"
          value={stats ? formatPrice(stats.totalVolume) : '—'}
          sub={`${stats?.totalBookings ?? 0} réservations`}
          icon={DollarSign}
          iconColor="text-[#E63946]"
          loading={kpiLoading}
        />
        <KpiCard
          label="Commission CarDrive"
          value={stats ? formatPrice(stats.platformCommission) : '—'}
          sub={`${commissionRate}% du volume`}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          loading={kpiLoading}
        />
        <KpiCard
          label="Agences actives"
          value={stats ? `${stats.verifiedAgencies} / ${stats.totalAgencies}` : '—'}
          sub="vérifiées"
          icon={Building2}
          iconColor="text-blue-600"
          loading={kpiLoading}
        />
        <KpiCard
          label="Véhicules référencés"
          value={stats?.totalVehicles ?? '—'}
          sub="flotte marketplace"
          icon={Car}
          iconColor="text-violet-600"
          loading={kpiLoading}
        />
      </div>

      {/* Financial breakdown + Booking status */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Financial ledger */}
        <AdminCard>
          <SectionHeader title="Répartition financière" subtitle="Commission CarDrive vs. revenu net agences" />
          <div className="mt-6">
            {/* Volume bar */}
            <div
              role="img"
              aria-label={`CarDrive ${commissionRate}%, agences ${100 - commissionRate}%`}
              className="h-3 rounded-full overflow-hidden bg-slate-100"
            >
              <div
                className="h-full bg-[#E63946] transition-[width] duration-700 ease-out rounded-full"
                style={{ width: `${commissionShare}%` }}
              />
            </div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <span className="mt-1.5 h-3 w-3 rounded-full bg-[#E63946] shrink-0" />
                <div>
                  <dt className="text-sm text-slate-500">Commission CarDrive ({commissionRate}%)</dt>
                  <dd className="text-2xl font-bold tabular-nums text-slate-900">
                    {formatPrice(stats?.platformCommission ?? 0)}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1.5 h-3 w-3 rounded-full bg-slate-800 shrink-0" />
                <div>
                  <dt className="text-sm text-slate-500">Net agences ({100 - commissionRate}%)</dt>
                  <dd className="text-2xl font-bold tabular-nums text-slate-900">
                    {formatPrice(agencyNet)}
                  </dd>
                </div>
              </div>
            </dl>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-sm">
              <span className="text-slate-500">Volume total</span>
              <span className="font-bold text-slate-900">{formatPrice(stats?.totalVolume ?? 0)}</span>
            </div>
          </div>
        </AdminCard>

        {/* Booking status breakdown */}
        <AdminCard>
          <SectionHeader title="Statut des réservations" />
          <div className="mt-5 space-y-4">
            {[
              { label: 'En attente', count: pendingBookings, color: 'bg-amber-400', icon: Clock },
              { label: 'Confirmées / Actives', count: confirmedBookings, color: 'bg-emerald-500', icon: CheckCircle },
              { label: 'Terminées', count: completedBookings, color: 'bg-slate-400', icon: Activity },
            ].map(({ label, count, color, icon: Icon }) => {
              const pct = bookings.length > 0 ? Math.round((count / bookings.length) * 100) : 0;
              return (
                <div key={label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                      <span className="text-sm text-slate-600">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 tabular-nums">{count}</span>
                      <span className="text-xs text-slate-400">({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between text-sm">
            <span className="text-slate-500">Total</span>
            <span className="font-bold text-slate-900 tabular-nums">{bookings.length}</span>
          </div>
        </AdminCard>
      </div>

      {/* Recent bookings + Pending agencies + Health */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Recent bookings */}
        <AdminCard noPadding>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sm:px-6">
            <h2 className="font-semibold text-slate-900">Réservations récentes</h2>
            <Link href="/admin/bookings" className="text-sm font-medium text-[#E63946] hover:underline">
              Tout voir →
            </Link>
          </div>
          {loading ? (
            <div className="divide-y divide-slate-50">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 sm:px-6">
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-32 rounded bg-slate-100 animate-pulse" />
                    <div className="h-3 w-48 rounded bg-slate-100 animate-pulse" />
                  </div>
                  <div className="h-6 w-16 rounded-full bg-slate-100 animate-pulse" />
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Aucune réservation"
              description="Les réservations apparaîtront ici dès que des clients en feront."
            />
          ) : (
            <ul className="divide-y divide-slate-50">
              {bookings.slice(0, 8).map((b) => (
                <li key={b.id} className="flex items-center gap-4 px-5 py-3 sm:px-6 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{b.customer_name}</p>
                    <p className="truncate text-xs text-slate-500 mt-0.5">
                      {b.vehicle?.brand} {b.vehicle?.model} · {b.agency?.name}
                    </p>
                  </div>
                  <span className="hidden tabular-nums text-sm font-semibold text-slate-900 sm:block">
                    {formatPrice(b.total_price)}
                  </span>
                  <BookingStatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        {/* Right column: pending agencies + health */}
        <div className="space-y-6">
          {/* Pending agencies */}
          <AdminCard noPadding>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sm:px-6">
              <h2 className="font-semibold text-slate-900">Agences à vérifier</h2>
              <Link href="/admin/agencies" className="text-sm font-medium text-[#E63946] hover:underline">
                Gérer →
              </Link>
            </div>
            {loading ? (
              <div className="px-5 py-4 space-y-2 sm:px-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : pendingAgencies.length === 0 ? (
              <EmptyState icon={CheckCircle} title="Tout est à jour" description="Aucune agence en attente." />
            ) : (
              <ul className="divide-y divide-slate-50">
                {pendingAgencies.slice(0, 4).map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{a.name}</p>
                      <p className="truncate text-xs text-slate-500">{a.city} · {a.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <AgencyStatusBadge status={a.status} />
                      <button
                        type="button"
                        disabled={verifyingId === a.id}
                        onClick={() => handleVerify(a, true)}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      >
                        {verifyingId === a.id ? '…' : 'Vérifier'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          {/* System health */}
          <AdminCard noPadding>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sm:px-6">
              <h2 className="font-semibold text-slate-900">Santé système</h2>
              <Link href="/admin/health" className="text-sm font-medium text-[#E63946] hover:underline">
                Détails →
              </Link>
            </div>
            {health ? (
              <ul className="divide-y divide-slate-50">
                {Object.entries(health.checks).map(([key, value]) => {
                  const ok = value !== 'error';
                  return (
                    <li key={key} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                      <div className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="flex-1 text-sm text-slate-700 capitalize">
                        {key === 'app' ? 'Application' : key === 'database' ? 'Base de données' : key === 'supabase' ? 'Supabase' : key}
                      </span>
                      <span className={`text-xs font-medium ${ok ? 'text-emerald-600' : 'text-red-600'}`}>
                        {ok ? 'OK' : 'Erreur'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-5 py-4 text-sm text-slate-500">Vérification en cours…</div>
            )}
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
