'use client';

import type { ReactNode } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  Car,
  CheckCircle2,
  Clock,
  Receipt,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { button } from '@/lib/design/tokens';
import { CardSkeleton, EmptyState, ErrorBanner, KpiSkeleton } from '@/components/agency/shell/Feedback';

/** Toutes les valeurs affichées proviennent de la base ; aucun montant n'est simulé. */
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

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Car;
  tone?: 'neutral' | 'brand' | 'success' | 'warning';
}) {
  const toneClass =
    tone === 'brand'
      ? 'bg-[#E63946]/10 text-[#E63946]'
      : tone === 'success'
        ? 'bg-emerald-50 text-emerald-600'
        : tone === 'warning'
          ? 'bg-amber-50 text-amber-600'
          : 'bg-slate-100 text-slate-500';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[#64748B]">{label}</p>
        <span
          aria-hidden="true"
          className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', toneClass)}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums text-[#0F172A]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[#64748B]">{hint}</p>}
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <h3 className="text-sm font-bold text-[#0F172A]">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function AgendaRow({
  primary,
  secondary,
  meta,
}: {
  primary: string;
  secondary: string;
  meta: string;
}) {
  return (
    <li className="flex items-center gap-3 px-5 py-3.5">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"
      >
        <CalendarClock className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#0F172A]">{primary}</p>
        <p className="truncate text-xs text-[#64748B]">{secondary}</p>
      </div>
      <span className="shrink-0 text-xs font-medium tabular-nums text-[#64748B]">{meta}</span>
    </li>
  );
}

export function OverviewPanel({
  stats,
  agenda,
  onRetry,
  onOpenBookings,
}: {
  stats: OverviewResource;
  agenda: AgendaResource;
  onRetry: () => void;
  onOpenBookings: () => void;
}) {
  if (stats.loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <KpiSkeleton key={index} />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <CardSkeleton rows={5} tall />
          <CardSkeleton rows={5} tall />
        </div>
      </div>
    );
  }

  if (stats.error || !stats.data) {
    return <ErrorBanner message={stats.error ?? 'Indicateurs indisponibles.'} onRetry={onRetry} />;
  }

  const s = stats.data;

  const alerts: { id: string; label: string; tone: 'alert' | 'info' }[] = [];
  if (s.pendingBookings > 0) {
    alerts.push({
      id: 'pending',
      tone: 'alert',
      label: `${s.pendingBookings} demande${s.pendingBookings > 1 ? 's' : ''} de reservation a traiter`,
    });
  }
  if (s.maintenanceVehicles > 0) {
    alerts.push({
      id: 'maintenance',
      tone: 'info',
      label: `${s.maintenanceVehicles} vehicule${s.maintenanceVehicles > 1 ? 's' : ''} en maintenance`,
    });
  }
  if (s.availableVehicles === 0 && s.totalVehicles > 0) {
    alerts.push({ id: 'no-stock', tone: 'alert', label: 'Aucun vehicule disponible a la location' });
  }

  const fleetRows = [
    { label: 'Disponibles', value: s.availableVehicles, tone: 'text-emerald-600' },
    { label: 'Loues', value: s.rentedVehicles, tone: 'text-[#E63946]' },
    { label: 'Reserves / bloques', value: s.reservedVehicles, tone: 'text-amber-600' },
    { label: 'En maintenance', value: s.maintenanceVehicles, tone: 'text-slate-500' },
  ];

  const lifecycleRows = [
    { label: 'En attente', value: s.pendingBookings, icon: Clock },
    { label: 'Confirmees / en cours', value: s.confirmedBookings, icon: CheckCircle2 },
    { label: 'Terminees', value: s.completedBookings, icon: Receipt },
    { label: 'Annulees / refusees', value: s.cancelledBookings, icon: AlertTriangle },
  ];

  const pickups = agenda.data?.upcomingPickups ?? [];
  const returns = agenda.data?.upcomingReturns ?? [];

  return (
    <div className="space-y-6">
      {alerts.length > 0 && (
        <ul className="space-y-2">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className={cn(
                'flex flex-col gap-3 rounded-2xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between',
                alert.tone === 'alert'
                  ? 'border-amber-200 bg-amber-50 text-amber-950'
                  : 'border-slate-200 bg-white text-[#0F172A]'
              )}
            >
              <span className="flex items-start gap-2">
                <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                {alert.label}
              </span>
              <button type="button" className={button.secondary} onClick={onOpenBookings}>
                Voir les reservations
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Demandes a traiter"
          value={String(s.pendingBookings)}
          hint="En attente de votre reponse"
          icon={Clock}
          tone={s.pendingBookings > 0 ? 'warning' : 'neutral'}
        />
        <KpiCard
          label="Vehicules disponibles"
          value={`${s.availableVehicles} / ${s.totalVehicles}`}
          hint={`Taux d'occupation ${s.occupancyRate} %`}
          icon={Car}
        />
        <KpiCard
          label="Volume des locations"
          value={formatPrice(s.grossRevenue)}
          hint={`${s.completedBookings + s.confirmedBookings} reservation(s) retenue(s)`}
          icon={TrendingUp}
          tone="brand"
        />
        <KpiCard
          label="Revenu net agence"
          value={formatPrice(s.agencyNet)}
          hint={`Commission CarDrive ${formatPrice(s.platformCommission)}`}
          icon={Wallet}
          tone="success"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Etat de la flotte">
          <ul className="divide-y divide-slate-100">
            {fleetRows.map((row) => (
              <li key={row.label} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm text-[#64748B]">{row.label}</span>
                <span className={cn('text-sm font-bold tabular-nums', row.tone)}>{row.value}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Cycle de vie des reservations">
          <ul className="divide-y divide-slate-100">
            {lifecycleRows.map((row) => {
              const Icon = row.icon;
              return (
                <li key={row.label} className="flex items-center gap-3 px-5 py-3.5">
                  <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="min-w-0 flex-1 text-sm text-[#64748B]">{row.label}</span>
                  <span className="text-sm font-bold tabular-nums text-[#0F172A]">{row.value}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Enlevements a venir"
          action={
            <button
              type="button"
              onClick={onOpenBookings}
              className="text-sm font-medium text-[#E63946] hover:underline"
            >
              Tout voir
            </button>
          }
        >
          {agenda.loading ? (
            <div className="px-5 py-4">
              <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ) : pickups.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {pickups.map((entry) => (
                <AgendaRow
                  key={entry.reference}
                  primary={entry.customerName}
                  secondary={`${entry.vehicleLabel} - ${entry.reference}`}
                  meta={entry.startDate ?? '-'}
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Aucun enlevement programme"
              text="Les departs confirmes apparaitront ici."
            />
          )}
        </Panel>

        <Panel title="Retours a venir">
          {agenda.loading ? (
            <div className="px-5 py-4">
              <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ) : returns.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {returns.map((entry) => (
                <AgendaRow
                  key={entry.reference}
                  primary={entry.customerName}
                  secondary={`${entry.vehicleLabel} - ${entry.reference}`}
                  meta={entry.endDate ?? '-'}
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Aucun retour programme"
              text="Les retours des locations en cours s'afficheront ici."
            />
          )}
        </Panel>
      </div>
    </div>
  );
}
