'use client';

import type { ReactNode } from 'react';
import { CalendarClock, Car, ClipboardList, Clock3, Settings, PlusCircle } from 'lucide-react';
import { CardSkeleton, EmptyState, ErrorBanner } from '@/components/agency/shell/Feedback';

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
  if (stats.loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton rows={5} tall />
        <CardSkeleton rows={5} tall />
      </div>
    );
  }

  if (stats.error || !stats.data) {
    return <ErrorBanner message={stats.error ?? 'Vue d’ensemble indisponible.'} onRetry={onRetry} />;
  }

  const data = stats.data;
  const pickups = agenda.data?.upcomingPickups ?? [];
  const returns = agenda.data?.upcomingReturns ?? [];
  const recentActivity = agenda.data?.recentActivity ?? [];

  const actions = [
    { label: 'Ajouter un véhicule', description: 'Compléter ou actualiser la flotte', icon: PlusCircle, onClick: onOpenFleet },
    { label: 'Gérer les disponibilités', description: 'Bloquer ou ouvrir des dates', icon: CalendarClock, onClick: onOpenCalendar },
    { label: 'Traiter les réservations', description: 'Consulter les demandes reçues', icon: ClipboardList, onClick: onOpenBookings },
    { label: 'Voir le forfait', description: 'Consulter ou changer de formule', icon: Settings, onClick: onOpenSubscription },
  ];

  const attentionItems = [
    data.pendingBookings > 0 && {
      label: 'Des demandes de réservation attendent votre réponse', action: onOpenBookings,
    },
    data.maintenanceVehicles > 0 && {
      label: 'Des véhicules sont actuellement en maintenance', action: onOpenFleet,
    },
    data.availableVehicles === 0 && data.totalVehicles > 0 && {
      label: 'Aucun véhicule disponible à la location', action: onOpenCalendar,
    },
  ].filter(Boolean) as { label: string; action: () => void }[];

  return (
    <div className="space-y-6">
      {attentionItems.length > 0 && (
        <Panel title="À surveiller">
          <div className="divide-y divide-slate-100">
            {attentionItems.map((item) => (
              <button key={item.label} type="button" onClick={item.action} className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left hover:bg-slate-50">
                <span className="flex items-center gap-3 text-sm font-medium text-[#0F172A]">
                  <Clock3 aria-hidden="true" className="h-4 w-4 text-amber-600" />
                  {item.label}
                </span>
                <span className="text-xs font-semibold text-[#E63946]">Ouvrir</span>
              </button>
            ))}
          </div>
        </Panel>
      )}

      <Panel title="Actions rapides">
        <div className="grid gap-px bg-slate-100 sm:grid-cols-2">
          {actions.map(({ label, description, icon: Icon, onClick }) => (
            <button key={label} type="button" onClick={onClick} className="flex items-center gap-3 bg-white px-5 py-4 text-left transition hover:bg-slate-50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#0B1220]">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[#0F172A]">{label}</span>
                <span className="mt-0.5 block text-xs text-[#64748B]">{description}</span>
              </span>
            </button>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="État de la flotte">
          <div className="divide-y divide-slate-100">
            <div className="flex items-center justify-between px-5 py-3.5"><span className="text-sm text-[#64748B]">Disponibles</span><span className="text-sm font-bold text-emerald-600">Vérifier les disponibilités</span></div>
            <div className="flex items-center justify-between px-5 py-3.5"><span className="text-sm text-[#64748B]">Loués</span><span className="text-sm font-bold text-[#E63946]">Locations en cours</span></div>
            <div className="flex items-center justify-between px-5 py-3.5"><span className="text-sm text-[#64748B]">Réservés / bloqués</span><span className="text-sm font-bold text-amber-600">Voir le calendrier</span></div>
            <button type="button" onClick={onOpenFleet} className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-semibold text-[#E63946] hover:bg-slate-50">
              <span>Consulter toute la flotte</span><Car className="h-4 w-4" />
            </button>
          </div>
        </Panel>

        <Panel title="Activité récente" action={<button type="button" onClick={onOpenBookings} className="text-sm font-medium text-[#E63946] hover:underline">Tout voir</button>}>
          {agenda.loading ? (
            <div className="px-5 py-4"><div className="h-14 animate-pulse rounded-lg bg-slate-100" /></div>
          ) : recentActivity.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {recentActivity.slice(0, 5).map((entry) => (
                <li key={entry.reference} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><ClipboardList className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#0F172A]">{entry.customerName}</p><p className="truncate text-xs text-[#64748B]">{entry.reference} · {entry.status}</p></div>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="Aucune activité récente" text="Les nouvelles réservations apparaîtront ici." />}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Enlèvements à venir" action={<button type="button" onClick={onOpenBookings} className="text-sm font-medium text-[#E63946] hover:underline">Tout voir</button>}>
          {agenda.loading ? (
            <div className="px-5 py-4"><div className="h-14 animate-pulse rounded-lg bg-slate-100" /></div>
          ) : pickups.length > 0 ? (
            <ul className="divide-y divide-slate-100">{pickups.map((entry) => <AgendaRow key={entry.reference} primary={entry.customerName} secondary={`${entry.vehicleLabel} - ${entry.reference}`} meta={entry.startDate ?? '-'} />)}</ul>
          ) : <EmptyState title="Aucun enlèvement programmé" text="Les départs confirmés apparaîtront ici." />}
        </Panel>

        <Panel title="Retours à venir">
          {agenda.loading ? (
            <div className="px-5 py-4"><div className="h-14 animate-pulse rounded-lg bg-slate-100" /></div>
          ) : returns.length > 0 ? (
            <ul className="divide-y divide-slate-100">{returns.map((entry) => <AgendaRow key={entry.reference} primary={entry.customerName} secondary={`${entry.vehicleLabel} - ${entry.reference}`} meta={entry.endDate ?? '-'} />)}</ul>
          ) : <EmptyState title="Aucun retour programmé" text="Les retours des locations en cours apparaîtront ici." />}
        </Panel>
      </div>
    </div>
  );
}
