'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Car,
  CalendarDays,
  RefreshCw,
  CheckCircle2,
  Clock,
  Activity,
  Download,
  Sparkles,
  ShieldCheck,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import type { AdminStats } from '@/lib/api/stats.api';
import {
  AdminCard,
  BookingStatusBadge,
  AgencyStatusBadge,
  Btn,
  ErrorBanner,
  EmptyState,
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
import type { Agency, Booking, SubscriptionStats } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  initialStats: AdminStats | null;
  statsError: string | null;
  commissionRate: number;
}

/* ── CSV export (internal) ───────────────────────────────────────────── */
function csvExport(bookings: Booking[]) {
  const header = ['Dossier', 'Client', 'Véhicule', 'Agence', 'Début', 'Fin', 'Statut'];
  const rows = bookings.map((b) =>
    [
      b.booking_ref ?? b.reference ?? '',
      b.customer_name,
      `${b.vehicle?.brand ?? ''} ${b.vehicle?.model ?? ''}`.trim(),
      b.agency?.name ?? '',
      b.start_date,
      b.end_date,
      b.status,
    ]
      .map((v) => {
        const s = String(v ?? '');
        return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(';')
  );
  const blob = new Blob(['\uFEFF' + [header.join(';'), ...rows].join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cardrive-reservations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Booking status labels ───────────────────────────────────────────── */
const BOOKING_STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  REQUESTED: 'Demandée',
  UNDER_REVIEW: 'En révision',
  CONFIRMED: 'Confirmée',
  APPROVED: 'Approuvée',
  ACTIVE: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  REJECTED: 'Refusée',
};

/* ── Health labels ───────────────────────────────────────────────────── */
const HEALTH_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  ok: { label: 'Opérationnel', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  configured: { label: 'Configuré', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  skipped: { label: 'Non configuré', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  error: { label: 'Erreur', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

/* ── Sub-components ──────────────────────────────────────────────────── */
function KpiBlock({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="h-4 w-24 rounded bg-slate-100 animate-pulse" />
        <div className="mt-3 h-8 w-20 rounded bg-slate-100 animate-pulse" />
        <div className="mt-2 h-3 w-16 rounded bg-slate-100 animate-pulse" />
      </div>
    );
  }
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={cn('rounded-lg p-2', accent ?? 'bg-slate-50')}>
          <Icon aria-hidden="true" className="h-4 w-4 text-slate-600" />
        </div>
      </div>
      <p className="mt-2.5 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function StatusBar({
  label,
  value,
  total,
  colorClass,
}: {
  label: string;
  value: number;
  total: number;
  colorClass: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-slate-700">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-slate-900">
          {value}
          <span className="ml-1 text-xs font-normal text-slate-500">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('h-2 rounded-full transition-all duration-500', colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function AgencyInitial({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0B1220] text-xs font-bold text-white">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function BookingInitial({ name }: { name: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════ */
export function AdminOverviewClient({ initialStats, statsError, commissionRate: _commissionRate }: Props) {
  const [stats, setStats] = useState<AdminStats | null>(initialStats);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats | null>(null);
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
      const [newStats, newBookings, newAgencies, , healthData, subJson] = await Promise.all([
        fetchAdminStats(),
        fetchAdminBookings(),
        fetchAdminAgencies(),
        fetchCommissionRatePct(),
        fetchHealth(),
        fetch('/api/admin/subscriptions')
          .then((r) => r.json())
          .catch(() => null),
      ]);
      if (ctrl.signal.aborted) return;
      setStats(newStats);
      setBookings(newBookings);
      setAgencies(newAgencies);
      if (subJson?.success && subJson.data?.stats) {
        setSubscriptionStats(subJson.data.stats);
      }
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

  /* ── Derived ─────────────────────────────────────────────────────── */
  const pendingBookings = bookings.filter((b) =>
    ['PENDING', 'REQUESTED', 'UNDER_REVIEW'].includes(b.status)
  ).length;
  const confirmedBookings = bookings.filter((b) =>
    ['CONFIRMED', 'APPROVED', 'ACTIVE'].includes(b.status)
  ).length;
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED').length;
  const cancelledBookings = bookings.filter((b) => ['CANCELLED', 'REJECTED'].includes(b.status)).length;
  const pendingAgencies = agencies.filter((a) => a.status === 'PENDING' || !a.verified);
  const verificationRate =
    stats && stats.totalAgencies > 0
      ? Math.round((stats.verifiedAgencies / stats.totalAgencies) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* ── Toast ────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 rounded-xl border px-5 py-3.5 shadow-lg text-sm font-medium',
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-800'
          )}
        >
          {toast.msg}
        </div>
      )}

      {/* ── Error banner ─────────────────────────────────────────────── */}
      {error && <ErrorBanner message={error} onRetry={() => void load('refresh')} retrying={refreshing} />}

      {/* ── Alert: pending agencies ───────────────────────────────────── */}
      {!loading && pendingAgencies.length > 0 && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />
            <p>
              <strong>{pendingAgencies.length}</strong> agence
              {pendingAgencies.length > 1 ? 's' : ''} en attente de vérification.
            </p>
          </div>
          <Link href="/admin/agencies?filter=PENDING">
            <Btn variant="secondary" size="sm">
              Traiter maintenant
            </Btn>
          </Link>
        </div>
      )}

      {/* ── Top bar: refresh + export ─────────────────────────────────── */}
      <div className="flex items-center justify-end gap-2">
        {lastRefresh && (
          <span className="text-xs text-slate-500">
            Actualisé à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <Btn variant="secondary" size="sm" onClick={() => void load('refresh')} disabled={refreshing}>
          <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} aria-hidden="true" />
          Actualiser
        </Btn>
        <Btn
          variant="secondary"
          size="sm"
          onClick={() => csvExport(bookings)}
          disabled={bookings.length === 0}
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Exporter CSV
        </Btn>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiBlock
          loading={loading}
          icon={Building2}
          label="Agences actives"
          value={loading ? '—' : `${stats?.verifiedAgencies ?? 0} / ${stats?.totalAgencies ?? 0}`}
          sub={`${verificationRate}% du réseau vérifiées`}
          accent="bg-blue-50"
        />
        <KpiBlock
          loading={loading}
          icon={Sparkles}
          label="Abonnements actifs"
          value={loading ? '—' : (subscriptionStats?.activeSubscribers ?? 0)}
          sub="Forfaits mensuels souscrits"
          accent="bg-amber-50"
        />
        <KpiBlock
          loading={loading}
          icon={Car}
          label="Véhicules référencés"
          value={loading ? '—' : (stats?.totalVehicles ?? 0)}
          sub="Flotte de la marketplace"
          accent="bg-indigo-50"
        />
        <KpiBlock
          loading={loading}
          icon={CalendarDays}
          label="Réservations totales"
          value={loading ? '—' : (stats?.totalBookings ?? 0)}
          sub={`${confirmedBookings} confirmées / en cours`}
          accent="bg-violet-50"
        />
      </div>

      {/* ── Subscription MRR banner ───────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0B1220] px-6 py-6 sm:px-8">
        {/* decorative glow */}
        <div className="pointer-events-none absolute -top-10 right-0 h-40 w-64 rounded-full bg-[#E63946]/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300 mb-3">
              <Sparkles className="h-3 w-3" />
              Modèle Abonnement · 0% de commission
            </div>
            <p className="text-sm font-medium text-slate-400">Revenu Récurrent Mensuel</p>
            <p className="mt-1 text-4xl font-extrabold tabular-nums tracking-tight text-white">
              {loading ? (
                <span className="inline-block h-9 w-32 rounded-lg bg-white/10 animate-pulse" />
              ) : (
                <>
                  {(subscriptionStats?.monthlyRecurringRevenue ?? 0).toLocaleString('fr-MA')}{' '}
                  <span className="text-xl font-normal text-slate-400">DH / mois</span>
                </>
              )}
            </p>
            <p className="mt-1.5 text-xs text-slate-500">
              {subscriptionStats?.activeSubscribers ?? 0} agences souscrites ·{' '}
              {subscriptionStats?.fleetCapacityTotal ?? 0} véhicules autorisés
            </p>
          </div>
          <Link
            href="/admin/subscriptions"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 self-start sm:self-auto"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            Gérer les forfaits
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* ── Main grid: bookings + right column ───────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Recent bookings */}
        <AdminCard noPadding>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-slate-900">Réservations récentes</h2>
            <Link href="/admin/bookings" className="text-sm font-medium text-[#E63946] hover:underline">
              Tout voir →
            </Link>
          </div>

          {/* Booking status pills */}
          <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
            {[
              { icon: Clock, label: 'En attente', count: pendingBookings, color: 'text-amber-600' },
              { icon: CheckCircle2, label: 'Confirmées', count: confirmedBookings, color: 'text-emerald-600' },
              { icon: Activity, label: 'Terminées', count: completedBookings, color: 'text-blue-600' },
              { icon: XCircle, label: 'Annulées', count: cancelledBookings, color: 'text-slate-400' },
            ].map(({ icon: Ic, label, count, color }) => (
              <div key={label} className="flex flex-col items-center py-3 px-2 text-center">
                <Ic className={cn('h-4 w-4 mb-1', color)} aria-hidden="true" />
                <p className="text-lg font-extrabold text-slate-900 tabular-nums">{loading ? '—' : count}</p>
                <p className="text-[10px] text-slate-500 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Status bars */}
          <div className="px-5 py-4 space-y-3 border-b border-slate-100 sm:px-6">
            <StatusBar label="Confirmées / En cours" value={confirmedBookings} total={bookings.length} colorClass="bg-emerald-500" />
            <StatusBar label="En attente" value={pendingBookings} total={bookings.length} colorClass="bg-amber-400" />
            <StatusBar label="Terminées" value={completedBookings} total={bookings.length} colorClass="bg-blue-400" />
          </div>

          {/* Booking rows */}
          {loading ? (
            <div className="divide-y divide-slate-50">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 sm:px-6">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 animate-pulse shrink-0" />
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
              description="Les réservations apparaîtront ici dès qu'elles arrivent."
            />
          ) : (
            <ul className="divide-y divide-slate-50">
              {bookings.slice(0, 8).map((b) => (
                <li
                  key={b.id}
                  className="flex items-center gap-3 px-5 py-3 sm:px-6 hover:bg-slate-50/60 transition-colors"
                >
                  <BookingInitial name={b.customer_name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{b.customer_name}</p>
                    <p className="truncate text-xs text-slate-500 mt-0.5">
                      {b.vehicle?.brand} {b.vehicle?.model} · {b.agency?.name}
                    </p>
                  </div>
                  <BookingStatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        {/* Right column */}
        <div className="space-y-6">
          {/* Pending agencies */}
          <AdminCard noPadding>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-900">Agences à vérifier</h2>
                {!loading && pendingAgencies.length > 0 && (
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#E63946] text-[10px] font-bold text-white">
                    {pendingAgencies.length}
                  </span>
                )}
              </div>
              <Link href="/admin/agencies" className="text-sm font-medium text-[#E63946] hover:underline">
                Gérer →
              </Link>
            </div>

            {loading ? (
              <div className="px-5 py-4 space-y-2 sm:px-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : pendingAgencies.length === 0 ? (
              <EmptyState icon={CheckCircle} title="Tout est à jour" description="Aucune agence en attente." />
            ) : (
              <ul className="divide-y divide-slate-50">
                {pendingAgencies.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                    <AgencyInitial name={a.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{a.name}</p>
                      <p className="truncate text-xs text-slate-500">{a.city} · {a.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <AgencyStatusBadge status={a.status} />
                      <button
                        type="button"
                        disabled={verifyingId === a.id}
                        onClick={() => handleVerify(a, true)}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      >
                        {verifyingId === a.id ? '…' : 'Vérifier'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          {/* Platform health */}
          <AdminCard noPadding>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#E63946]" aria-hidden="true" />
                <h2 className="font-semibold text-slate-900">Santé plateforme</h2>
              </div>
              <Link href="/admin/health" className="text-sm font-medium text-[#E63946] hover:underline">
                Détails →
              </Link>
            </div>

            {health ? (
              <ul className="divide-y divide-slate-50">
                {Object.entries(health.checks).map(([key, value]) => {
                  const meta = HEALTH_LABEL[value] ?? { label: value, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' };
                  return (
                    <li key={key} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                          meta.bg
                        )}
                      >
                        <Activity aria-hidden="true" className={cn('h-3.5 w-3.5', meta.color)} />
                      </div>
                      <span className="flex-1 text-sm font-medium text-slate-700">
                        {key === 'app'
                          ? 'Application'
                          : key === 'database'
                          ? 'Base de données'
                          : key === 'supabase'
                          ? 'Supabase'
                          : key}
                      </span>
                      <span
                        className={cn(
                          'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                          meta.bg,
                          meta.color
                        )}
                      >
                        {meta.label}
                      </span>
                    </li>
                  );
                })}

                {/* Static health checks */}
                {[
                  { icon: ShieldCheck, title: 'Anti-doublons', ok: true },
                  { icon: Building2, title: 'Multi-agences', ok: true },
                  { icon: Users, title: 'Contacts WhatsApp', ok: true },
                ].map(({ icon: Ic, title, ok }) => (
                  <li key={title} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50">
                      <Ic aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-slate-700">{title}</span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                      {ok ? 'Actif' : 'Inactif'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-6 flex items-center gap-2 text-sm text-slate-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Vérification en cours…
              </div>
            )}
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
