'use client';

import type { ReactNode } from 'react';
import {
  CalendarClock,
  Car,
  ClipboardList,
  Clock,
  Clock3,
  PlusCircle,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  TrendingUp,
  ArrowUpRight,
  CalendarCheck,
  CalendarX,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CardSkeleton, EmptyState, ErrorBanner, KpiSkeleton } from '@/components/agency/shell/Feedback';

/* ─────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────── */
export type OverviewResource =
  | { loading: true; error: null; data: null }
  | { loading: false; error: string | null; data: import('@/lib/services/stats.service').AgencyDashboardStats | null };

export type AgendaResource =
  | { loading: true; error: null; data: null }
  | { loading: false; error: string | null; data: null }
  | {
      loading: false;
      error: null;
      data: {
        upcomingPickups: readonly {
          reference: string;
          customerName: string;
          startDate?: string;
          vehicleLabel: string;
        }[];
        upcomingReturns: readonly {
          reference: string;
          customerName: string;
          endDate?: string;
          vehicleLabel: string;
        }[];
        recentActivity: readonly {
          reference: string;
          customerName: string;
          status: string;
          totalPrice: number;
        }[];
      };
    };

/* ─────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────── */

function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('overflow-hidden rounded-2xl border border-slate-200 bg-white', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-bold text-[#0F172A]">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-[#64748B]">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  iconBg,
  iconColor,
  loading,
  onClick,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: typeof Car;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
  onClick?: () => void;
  accent?: boolean;
}) {
  const Tag = onClick ? 'button' : 'article';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all',
        onClick && 'cursor-pointer hover:border-slate-300 hover:shadow-sm active:scale-[0.99]',
        accent && 'border-[#E63946]/20 bg-linear-to-br from-[#E63946]/5 via-white to-white'
      )}
    >
      {/* Subtle accent line */}
      {accent && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-[#E63946]"
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', iconBg, iconColor)}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
        {onClick && (
          <ChevronRight
            className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-500"
            aria-hidden="true"
          />
        )}
      </div>
      {loading ? (
        <div className="mt-3 space-y-2">
          <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
        </div>
      ) : (
        <>
          <p className="mt-3 text-2xl font-extrabold tabular-nums tracking-tight text-[#0F172A] sm:text-3xl">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-[#64748B]">{hint}</p>}
        </>
      )}
    </Tag>
  );
}

function StatusBar({
  label,
  value,
  total,
  color,
  textColor,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  textColor: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-[#334155]">{label}</span>
        <span className={cn('font-bold tabular-nums', textColor)}>
          {value} <span className="font-normal text-slate-400">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function AgendaRow({
  primary,
  secondary,
  meta,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  primary: string;
  secondary: string;
  meta: string;
  icon: typeof CalendarClock;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <li className="flex items-center gap-3 px-5 py-3.5">
      <span
        aria-hidden="true"
        className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', iconBg, iconColor)}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#0F172A]">{primary}</p>
        <p className="truncate text-xs text-[#64748B]">{secondary}</p>
      </div>
      <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-[#0F172A]">
        {meta}
      </span>
    </li>
  );
}

const BOOKING_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'En attente', cls: 'bg-amber-100 text-amber-800' },
  REQUESTED: { label: 'Demandée', cls: 'bg-amber-100 text-amber-800' },
  CONFIRMED: { label: 'Confirmée', cls: 'bg-emerald-100 text-emerald-800' },
  APPROVED: { label: 'Approuvée', cls: 'bg-emerald-100 text-emerald-800' },
  ACTIVE: { label: 'En cours', cls: 'bg-blue-100 text-blue-800' },
  COMPLETED: { label: 'Terminée', cls: 'bg-slate-100 text-slate-600' },
  CANCELLED: { label: 'Annulée', cls: 'bg-red-100 text-red-700' },
  REJECTED: { label: 'Refusée', cls: 'bg-red-100 text-red-700' },
};

/* ─────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────── */
export function OverviewPanel({
  stats,
  agenda,
  onRetry,
  onOpenBookings,
  onOpenFleet,
  onOpenCalendar,
  onOpenSubscription,
}: {
  stats: OverviewResource;
  agenda: AgendaResource;
  onRetry: () => void;
  onOpenBookings: () => void;
  onOpenFleet: () => void;
  onOpenCalendar: () => void;
  onOpenSubscription: () => void;
}) {
  /* ── Loading skeleton ── */
  if (stats.loading) {
    return (
      <div className="space-y-6">
        {/* KPI row skeleton */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <KpiSkeleton key={i} />)}
        </div>
        {/* Fleet + Bookings row skeleton */}
        <div className="grid gap-6 xl:grid-cols-2">
          <CardSkeleton rows={4} tall />
          <CardSkeleton rows={4} tall />
        </div>
        {/* Agenda skeleton */}
        <div className="grid gap-6 xl:grid-cols-2">
          <CardSkeleton rows={3} />
          <CardSkeleton rows={3} />
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (stats.error || !stats.data) {
    return <ErrorBanner message={stats.error ?? "Vue d'ensemble indisponible."} onRetry={onRetry} />;
  }

  const d = stats.data;
  const pickups = agenda.data?.upcomingPickups ?? [];
  const returns = agenda.data?.upcomingReturns ?? [];
  const recentActivity = agenda.data?.recentActivity ?? [];

  const totalBookings = d.pendingBookings + d.confirmedBookings + d.completedBookings + d.cancelledBookings;

  /* Priority alerts */
  const alerts: { id: string; label: string; tone: 'urgent' | 'warn'; action: () => void }[] = [];
  if (d.pendingBookings > 0) {
    alerts.push({
      id: 'pending',
      tone: 'urgent',
      label: `${d.pendingBookings} demande${d.pendingBookings > 1 ? 's' : ''} de réservation attend${d.pendingBookings > 1 ? 'ent' : ''} votre réponse`,
      action: onOpenBookings,
    });
  }
  if (d.availableVehicles === 0 && d.totalVehicles > 0) {
    alerts.push({
      id: 'no-stock',
      tone: 'warn',
      label: 'Aucun véhicule disponible à la location — vérifiez le calendrier',
      action: onOpenCalendar,
    });
  }
  if (d.maintenanceVehicles > 0) {
    alerts.push({
      id: 'maintenance',
      tone: 'warn',
      label: `${d.maintenanceVehicles} véhicule${d.maintenanceVehicles > 1 ? 's' : ''} en maintenance`,
      action: onOpenFleet,
    });
  }

  /* Quick actions */
  const actions = [
    { label: 'Ajouter un véhicule', desc: 'Actualiser la flotte', icon: PlusCircle, onClick: onOpenFleet },
    { label: 'Gérer les disponibilités', desc: 'Bloquer ou ouvrir des dates', icon: CalendarClock, onClick: onOpenCalendar },
    { label: 'Traiter les réservations', desc: 'Demandes reçues', icon: ClipboardList, onClick: onOpenBookings },
    { label: 'Mon abonnement', desc: 'Consulter ou changer de formule', icon: Settings, onClick: onOpenSubscription },
  ] as const;

  return (
    <div className="space-y-6">

      {/* ── Priority Alerts ── */}
      {alerts.length > 0 && (
        <ul className="space-y-2">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <button
                type="button"
                onClick={alert.action}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all hover:shadow-sm',
                  alert.tone === 'urgent'
                    ? 'border-[#E63946]/30 bg-[#E63946]/5 text-[#7f1d1d]'
                    : 'border-amber-200 bg-amber-50 text-amber-950'
                )}
              >
                <AlertTriangle
                  aria-hidden="true"
                  className={cn(
                    'h-4 w-4 shrink-0',
                    alert.tone === 'urgent' ? 'text-[#E63946]' : 'text-amber-600'
                  )}
                />
                <span className="min-w-0 flex-1 text-sm font-medium">{alert.label}</span>
                <span
                  className={cn(
                    'shrink-0 text-xs font-bold',
                    alert.tone === 'urgent' ? 'text-[#E63946]' : 'text-amber-700'
                  )}
                >
                  Traiter →
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ── KPI Cards row ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Demandes en attente"
          value={d.pendingBookings}
          hint="À traiter en priorité"
          icon={Clock3}
          iconBg={d.pendingBookings > 0 ? 'bg-[#E63946]/10' : 'bg-slate-100'}
          iconColor={d.pendingBookings > 0 ? 'text-[#E63946]' : 'text-slate-500'}
          accent={d.pendingBookings > 0}
          onClick={onOpenBookings}
        />
        <KpiCard
          label="Véhicules disponibles"
          value={`${d.availableVehicles} / ${d.totalVehicles}`}
          hint={`Taux d'occupation : ${d.occupancyRate}%`}
          icon={Car}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          onClick={onOpenFleet}
        />
        <KpiCard
          label="Confirmées / En cours"
          value={d.confirmedBookings}
          hint="Réservations actives"
          icon={CheckCircle2}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          onClick={onOpenBookings}
        />
        <KpiCard
          label="Réservations terminées"
          value={d.completedBookings}
          hint="Depuis le début de la période"
          icon={TrendingUp}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
      </div>

      {/* ── Fleet status + Booking cycle ── */}
      <div className="grid gap-6 xl:grid-cols-2">

        {/* Fleet status panel */}
        <Panel title="État de la flotte" subtitle={`${d.totalVehicles} véhicule${d.totalVehicles !== 1 ? 's' : ''} au total`}>
          <div className="px-5 py-5 space-y-4">
            <StatusBar label="Disponibles" value={d.availableVehicles} total={d.totalVehicles} color="bg-emerald-500" textColor="text-emerald-600" />
            <StatusBar label="Loués / En location" value={d.rentedVehicles} total={d.totalVehicles} color="bg-[#E63946]" textColor="text-[#E63946]" />
            <StatusBar label="Réservés / Bloqués" value={d.reservedVehicles} total={d.totalVehicles} color="bg-amber-500" textColor="text-amber-600" />
            <StatusBar label="En maintenance" value={d.maintenanceVehicles} total={d.totalVehicles} color="bg-slate-400" textColor="text-slate-500" />
          </div>
          <div className="border-t border-slate-100 px-5 py-3">
            <button
              type="button"
              onClick={onOpenFleet}
              className="flex w-full items-center justify-between text-sm font-semibold text-[#E63946] hover:opacity-80 transition-opacity"
            >
              <span>Gérer la flotte</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </Panel>

        {/* Booking lifecycle panel */}
        <Panel title="Cycle de vie des réservations" subtitle={totalBookings > 0 ? `${totalBookings} dossiers` : 'Aucun dossier'}>
          <div className="divide-y divide-slate-100">
            {[
              { label: 'En attente de traitement', value: d.pendingBookings, icon: Clock, cls: 'bg-amber-50 text-amber-600' },
              { label: 'Confirmées / Actives', value: d.confirmedBookings, icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-600' },
              { label: 'Terminées', value: d.completedBookings, icon: CalendarCheck, cls: 'bg-blue-50 text-blue-600' },
              { label: 'Annulées / Refusées', value: d.cancelledBookings, icon: CalendarX, cls: 'bg-slate-100 text-slate-500' },
            ].map(({ label, value, icon: Icon, cls }) => (
              <div key={label} className="flex items-center gap-3 px-5 py-3.5">
                <span aria-hidden="true" className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', cls)}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 text-sm text-[#334155]">{label}</span>
                <span className="shrink-0 text-sm font-extrabold tabular-nums text-[#0F172A]">{value}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 px-5 py-3">
            <button
              type="button"
              onClick={onOpenBookings}
              className="flex w-full items-center justify-between text-sm font-semibold text-[#E63946] hover:opacity-80 transition-opacity"
            >
              <span>Toutes les réservations</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </Panel>
      </div>

      {/* ── Agenda row ── */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Enlèvements à venir"
          subtitle="Départs de locations confirmées"
          action={
            <button
              type="button"
              onClick={onOpenBookings}
              className="text-xs font-semibold text-[#E63946] hover:underline"
            >
              Tout voir
            </button>
          }
        >
          {agenda.loading ? (
            <div className="px-5 py-4 space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : pickups.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {pickups.slice(0, 5).map((entry) => (
                <AgendaRow
                  key={entry.reference}
                  primary={entry.customerName}
                  secondary={`${entry.vehicleLabel} · ${entry.reference}`}
                  meta={entry.startDate ?? '-'}
                  icon={CalendarCheck}
                  iconBg="bg-emerald-50"
                  iconColor="text-emerald-600"
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Aucun enlèvement programmé"
              text="Les départs confirmés apparaîtront ici."
            />
          )}
        </Panel>

        <Panel
          title="Retours à venir"
          subtitle="Fins de contrats de location"
        >
          {agenda.loading ? (
            <div className="px-5 py-4 space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : returns.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {returns.slice(0, 5).map((entry) => (
                <AgendaRow
                  key={entry.reference}
                  primary={entry.customerName}
                  secondary={`${entry.vehicleLabel} · ${entry.reference}`}
                  meta={entry.endDate ?? '-'}
                  icon={CalendarX}
                  iconBg="bg-blue-50"
                  iconColor="text-blue-600"
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Aucun retour programmé"
              text="Les retours des locations en cours s'afficheront ici."
            />
          )}
        </Panel>
      </div>

      {/* ── Recent Activity + Quick Actions ── */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Recent activity */}
        <Panel
          title="Activité récente"
          subtitle="Dernières demandes reçues"
          action={
            <button
              type="button"
              onClick={onOpenBookings}
              className="text-xs font-semibold text-[#E63946] hover:underline"
            >
              Tout voir
            </button>
          }
        >
          {agenda.loading ? (
            <div className="px-5 py-4 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : recentActivity.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {recentActivity.slice(0, 6).map((entry) => {
                const statusInfo = BOOKING_STATUS_LABELS[entry.status] ?? { label: entry.status, cls: 'bg-slate-100 text-slate-600' };
                return (
                  <li key={entry.reference} className="flex items-center gap-3 px-5 py-3.5">
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
                    >
                      <ClipboardList className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#0F172A]">{entry.customerName}</p>
                      <p className="truncate text-xs text-[#64748B]">{entry.reference}</p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                        statusInfo.cls
                      )}
                    >
                      {statusInfo.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              title="Aucune activité récente"
              text="Les nouvelles réservations apparaîtront ici."
            />
          )}
        </Panel>

        {/* Quick actions */}
        <Panel title="Actions rapides" subtitle="Accès direct aux sections">
          <div className="divide-y divide-slate-100">
            {actions.map(({ label, desc, icon: Icon, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className="group flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50"
              >
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0B1220]/5 text-[#0B1220] transition-colors group-hover:bg-[#0B1220] group-hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#0F172A]">{label}</span>
                  <span className="mt-0.5 block text-xs text-[#64748B]">{desc}</span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-600"
                />
              </button>
            ))}
          </div>
        </Panel>
      </div>

      {/* ── Occupancy Banner ── */}
      {d.totalVehicles > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-r from-[#0B1220] to-slate-800 px-6 py-5 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Zap className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                  Taux d&apos;occupation actuel
                </p>
                <p className="mt-0.5 text-2xl font-extrabold tabular-nums tracking-tight">
                  {d.occupancyRate}%
                  <span className="ml-2 text-sm font-normal text-white/60">
                    ({d.rentedVehicles} loué{d.rentedVehicles !== 1 ? 's' : ''} sur {d.totalVehicles})
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onOpenCalendar}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20"
              >
                <CalendarClock className="h-3.5 w-3.5" />
                Calendrier
              </button>
              <button
                type="button"
                onClick={onOpenFleet}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#E63946] px-4 py-2 text-xs font-bold text-white transition hover:bg-red-600"
              >
                <Car className="h-3.5 w-3.5" />
                Ma flotte
              </button>
            </div>
          </div>

          {/* Occupancy progress bar */}
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-700"
              style={{ width: `${Math.min(d.occupancyRate, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
