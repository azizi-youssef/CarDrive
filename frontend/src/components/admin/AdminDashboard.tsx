'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Car,
  CheckCircle2,
  Inbox,
  LayoutDashboard,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  XCircle,
  Loader2,
  AlertCircle,
  Download,
  LogOut,
  Activity,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';

import {
  fetchAdminAgencies,
  fetchAdminBookings,
  fetchAdminStats,
  fetchCommissionRatePct,
  fetchHealth,
  patchAgencyVerification,
  type HealthReport,
} from '@/lib/api/admin-dashboard.api';
import type { AdminStats } from '@/lib/api/stats.api';
import { Badge } from '@/components/ui/Badge';
import { getErrorMessage } from '@/lib/errors';
import { formatPrice } from '@/lib/utils';
import type { Agency, Booking, AgencySubscription, SubscriptionPlan, SubscriptionStats } from '@/types';

/* =========================================================
   FONTS
========================================================= */

const displayFont = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const bodyFont = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

/* =========================================================
   TYPES & CONSTANTES
========================================================= */

type Tab = 'overview' | 'agencies' | 'subscriptions' | 'bookings';
type BookingFilter = 'ALL' | 'CONFIRMED' | 'PENDING';
type AgencyFilter = 'ALL' | 'PENDING' | 'ACTIVE' | 'SUSPENDED';

const HEALTH_LABEL: Record<string, string> = {
  ok: 'Opérationnel',
  configured: 'Configuré',
  skipped: 'Non configuré (mode démo)',
  error: 'Erreur',
};

function csvCell(value: unknown): string {
  const text = String(value ?? '');
  return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportBookingsCsv(rows: Booking[]) {
  const header = [
    'Dossier',
    'Agence',
    'Client',
    'Véhicule',
    'Début',
    'Fin',
    'Montant (100% agence)',
    'Commission CarDrive',
    'Statut',
  ];
  const lines = rows.map((b) =>
    [
      b.booking_ref ?? b.reference,
      b.agency?.name,
      b.customer_name,
      `${b.vehicle?.brand ?? ''} ${b.vehicle?.model ?? ''}`.trim(),
      b.start_date,
      b.end_date,
      b.total_price,
      '0 DH (0%)',
      BOOKING_STATUS_LABEL[b.status] ?? b.status,
    ]
      .map(csvCell)
      .join(';')
  );
  // BOM pour qu'Excel lise correctement l'UTF-8
  const blob = new Blob(['\uFEFF' + [header.join(';'), ...lines].join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reservations-cardrive-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const DEFAULT_COMMISSION_PCT = 15;
const TABLE_PAGE_SIZE = 15;

const EMPTY_STATS: AdminStats = {
  totalAgencies: 0,
  verifiedAgencies: 0,
  pendingAgencies: 0,
  totalVehicles: 0,
  totalBookings: 0,
  totalVolume: 0,
  platformCommission: 0,
  agencyNet: 0,
};

type ToastState = { type: 'success' | 'error'; message: string } | null;

const TAB_TITLES: Record<Tab, { title: string; subtitle: string }> = {
  overview: {
    title: "Vue d'ensemble",
    subtitle: "Activité de la marketplace CarDrive à Nador.",
  },
  agencies: {
    title: 'Agences partenaires',
    subtitle: 'Vérifiez, activez ou suspendez les partenaires.',
  },
  subscriptions: {
    title: 'Abonnements & Flotte',
    subtitle: 'Revenu mensuel récurrent (MRR), paliers et gestion des quotas de flotte agences.',
  },
  bookings: {
    title: 'Réservations',
    subtitle: 'Toutes les transactions de la plateforme.',
  },
};

const AGENCY_STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspendue',
  PENDING: 'En attente',
};

const BOOKING_STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Confirmée',
  APPROVED: 'Approuvée',
  REQUESTED: 'Demandée',
  PENDING: 'En attente',
  CANCELLED: 'Annulée',
  COMPLETED: 'Terminée',
  REJECTED: 'Refusée',
  ACTIVE: 'En cours',
};

function bookingBadgeVariant(status: string) {
  if (status === 'CONFIRMED' || status === 'APPROVED' || status === 'ACTIVE') return 'available';
  if (status === 'PENDING' || status === 'REQUESTED') return 'pending';
  return 'rented';
}

function isConfirmedLike(status: string) {
  return status === 'CONFIRMED' || status === 'APPROVED' || status === 'ACTIVE';
}

function isPendingLike(status: string) {
  return status === 'PENDING' || status === 'REQUESTED';
}

/* =========================================================
   MARQUE OFFICIELLE
========================================================= */

function AdminLogo({ small = false }: { small?: boolean }) {
  return (
    <Link
      href="/admin"
      className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-90 focus:outline-none"
    >
      <div className={`relative ${small ? 'h-7 w-31.25' : 'h-9 w-37.5'}`}>
        <Image
          src="/logo_12.png"
          alt="CarDrive Admin"
          fill
          sizes={small ? '125px' : '150px'}
          className="object-contain object-left"
          priority
        />
      </div>
      <span className="rounded bg-[#E63946] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
        Admin
      </span>
    </Link>
  );
}

// Alias de compatibilité
function PlateMark({ small = false }: { small?: boolean }) {
  return <AdminLogo small={small} />;
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [agencySearch, setAgencySearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>('ALL');
  const [agencyFilter, setAgencyFilter] = useState<AgencyFilter>('ALL');
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [agencyPage, setAgencyPage] = useState(0);
  const [bookingPage, setBookingPage] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [commissionRatePct, setCommissionRatePct] = useState(DEFAULT_COMMISSION_PCT);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [verifyingAgencyId, setVerifyingAgencyId] = useState<string | null>(null);

  // Données des abonnements agences
  const [subscriptionData, setSubscriptionData] = useState<{
    subscriptions: AgencySubscription[];
    stats: SubscriptionStats;
    plans: SubscriptionPlan[];
  } | null>(null);
  const [subFilter, setSubFilter] = useState<string>('ALL');
  const [subSearch, setSubSearch] = useState<string>('');
  const [subPage, setSubPage] = useState<number>(0);
  const [editingAgencySub, setEditingAgencySub] = useState<AgencySubscription | null>(null);
  const [newPlanSlug, setNewPlanSlug] = useState<string>('');
  const [updatingPlan, setUpdatingPlan] = useState<boolean>(false);

  const abortRef = useRef<AbortController | null>(null);
  const refreshingRef = useRef(false);

  const commissionLabel = `${Math.round(commissionRatePct)} %`;
  const agencyShareLabel = `${Math.round(100 - commissionRatePct)} %`;

  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);

  const showToast = useCallback((next: ToastState) => {
    setToast(next);
    if (next) {
      window.setTimeout(() => setToast(null), 5000);
    }
  }, []);

  const applyDevFallback = useCallback(() => {
    setStats(EMPTY_STATS);
    setAgencies([]);
    setAllBookings([]);
  }, []);

  const loadDashboard = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (mode === 'refresh' && refreshingRef.current) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (mode === 'initial') setLoading(true);
      else {
        refreshingRef.current = true;
        setRefreshing(true);
      }
      setError(null);

      try {
        const [statsData, agenciesData, bookingsData, commissionPct, healthData, subJson] =
          await Promise.all([
            fetchAdminStats(),
            fetchAdminAgencies(),
            fetchAdminBookings(),
            fetchCommissionRatePct(),
            fetchHealth(),
            fetch('/api/admin/subscriptions').then((r) => r.json()).catch(() => null),
          ]);

        if (controller.signal.aborted) return;
        setHealth(healthData);

        setStats(statsData);
        setAgencies(agenciesData);
        setAllBookings(bookingsData);
        if (commissionPct != null) setCommissionRatePct(commissionPct);
        if (subJson?.success && subJson.data) {
          setSubscriptionData(subJson.data);
        }
        setLastRefresh(new Date());
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('[AdminDashboard] loadDashboard:', err);
        applyDevFallback();
        setError(
          getErrorMessage(
            err,
            'Impossible de charger le tableau de bord. Données locales affichées.'
          )
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          refreshingRef.current = false;
          setRefreshing(false);
        }
      }
    },
    [applyDevFallback]
  );

  useEffect(() => {
    void loadDashboard('initial');
    return () => abortRef.current?.abort();
  }, [loadDashboard]);

  const handleRefresh = () => {
    void loadDashboard('refresh');
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.assign('/login?portal=admin');
    }
  };

  const handleVerifyAgency = async (
    agency: { id: string; name: string },
    verified: boolean
  ) => {
    if (
      !verified &&
      !window.confirm(
        `Révoquer la vérification de ${agency.name} ? L'agence sera suspendue.`
      )
    ) {
      return;
    }

    setVerifyingAgencyId(agency.id);
    try {
      await patchAgencyVerification(agency.id, {
        status: verified ? 'ACTIVE' : 'SUSPENDED',
        verified,
      });
      showToast({
        type: 'success',
        message: verified
          ? `${agency.name} — agence vérifiée avec succès.`
          : `Vérification de ${agency.name} révoquée.`,
      });
      await loadDashboard('refresh');
    } catch (err) {
      console.error('[AdminDashboard] handleVerifyAgency:', err);
      showToast({
        type: 'error',
        message: getErrorMessage(
          err,
          'Impossible de modifier le statut de l’agence. Réessayez.'
        ),
      });
    } finally {
      setVerifyingAgencyId(null);
    }
  };

  /* ---------- Données dérivées ---------- */

  const confirmedBookings = allBookings.filter((b) => isConfirmedLike(b.status)).length;
  const pendingBookings = allBookings.filter((b) => isPendingLike(b.status)).length;
  const otherBookings = Math.max(
    0,
    allBookings.length - confirmedBookings - pendingBookings,
  );

  const verificationRate =
    stats.totalAgencies > 0
      ? Math.round((stats.verifiedAgencies / stats.totalAgencies) * 100)
      : 0;

  const agencyNet =
    stats.agencyNet ?? Math.max(0, stats.totalVolume - stats.platformCommission);

  const commissionShare =
    stats.totalVolume > 0
      ? Math.min(
        100,
        Math.round((stats.platformCommission / stats.totalVolume) * 100),
      )
      : 0;

  const filteredAgencies = useMemo(() => {
    const query = agencySearch.trim().toLowerCase();
    return agencies.filter((agency) => {
      if (agencyFilter !== 'ALL' && agency.status !== agencyFilter) return false;
      if (!query) return true;
      return (
        agency.name.toLowerCase().includes(query) ||
        agency.email.toLowerCase().includes(query) ||
        agency.phone.toLowerCase().includes(query)
      );
    });
  }, [agencies, agencySearch, agencyFilter]);

  const pendingAgencies = useMemo(
    () => agencies.filter((a) => a.status === 'PENDING' || !a.verified),
    [agencies],
  );

  const filteredBookings = useMemo(() => {
    const query = bookingSearch.trim().toLowerCase();
    return allBookings.filter((booking) => {
      if (bookingFilter === 'CONFIRMED' && !isConfirmedLike(booking.status)) {
        return false;
      }
      if (bookingFilter === 'PENDING' && !isPendingLike(booking.status)) {
        return false;
      }
      if (!query) return true;
      return (
        String(booking.booking_ref ?? '').toLowerCase().includes(query) ||
        String(booking.customer_name ?? '').toLowerCase().includes(query) ||
        String(booking.agency?.name ?? '').toLowerCase().includes(query)
      );
    });
  }, [allBookings, bookingSearch, bookingFilter]);

  const paginatedAgencies = useMemo(() => {
    const start = agencyPage * TABLE_PAGE_SIZE;
    return filteredAgencies.slice(start, start + TABLE_PAGE_SIZE);
  }, [filteredAgencies, agencyPage]);

  const paginatedBookings = useMemo(() => {
    const start = bookingPage * TABLE_PAGE_SIZE;
    return filteredBookings.slice(start, start + TABLE_PAGE_SIZE);
  }, [filteredBookings, bookingPage]);

  const agencyPageCount = Math.max(1, Math.ceil(filteredAgencies.length / TABLE_PAGE_SIZE));
  const bookingPageCount = Math.max(1, Math.ceil(filteredBookings.length / TABLE_PAGE_SIZE));

  useEffect(() => {
    setAgencyPage(0);
  }, [agencySearch, agencyFilter]);

  useEffect(() => {
    setBookingPage(0);
  }, [bookingSearch, bookingFilter]);

  const handleUpdateAgencyPlan = async (agencyId: string, planSlug: string) => {
    setUpdatingPlan(true);
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId, planSlug }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erreur lors de la mise à jour du forfait.');
      }
      showToast({ type: 'success', message: 'Forfait de l’agence mis à jour avec succès.' });
      setEditingAgencySub(null);
      void loadDashboard('refresh');
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Erreur lors de la mise à jour.' });
    } finally {
      setUpdatingPlan(false);
    }
  };

  const filteredSubscriptions = useMemo(() => {
    if (!subscriptionData?.subscriptions) return [];
    let list = subscriptionData.subscriptions;
    if (subFilter !== 'ALL') {
      list = list.filter((s) => s.plan.slug === subFilter);
    }
    if (subSearch.trim()) {
      const q = subSearch.toLowerCase();
      list = list.filter(
        (s) =>
          s.agency_name?.toLowerCase().includes(q) ||
          s.plan.name.toLowerCase().includes(q) ||
          s.status.toLowerCase().includes(q)
      );
    }
    return list;
  }, [subscriptionData, subFilter, subSearch]);

  const subPageCount = Math.max(1, Math.ceil(filteredSubscriptions.length / TABLE_PAGE_SIZE));
  const paginatedSubscriptions = useMemo(() => {
    const start = subPage * TABLE_PAGE_SIZE;
    return filteredSubscriptions.slice(start, start + TABLE_PAGE_SIZE);
  }, [filteredSubscriptions, subPage]);

  const navItems: {
    id: Tab;
    label: string;
    icon: LucideIcon;
    count?: number;
  }[] = [
      { id: 'overview', label: 'Vue globale', icon: LayoutDashboard },
      {
        id: 'agencies',
        label: 'Agences',
        icon: Building2,
        count: agencies.length,
      },
      {
        id: 'subscriptions',
        label: 'Abonnements',
        icon: Sparkles,
        count: subscriptionData?.stats?.activeSubscribers ?? subscriptionData?.subscriptions?.length,
      },
      {
        id: 'bookings',
        label: 'Réservations',
        icon: CalendarDays,
        count: allBookings.length,
      },
    ];

  const heading = TAB_TITLES[activeTab];

  if (loading) {
    return (
      <div
        className={`${displayFont.variable} ${bodyFont.variable} min-h-screen bg-[#F3F5F7] font-(family-name:--font-body) text-slate-900`}
      >
        <AdminDashboardSkeleton />
      </div>
    );
  }

  return (
    <div
      className={`${displayFont.variable} ${bodyFont.variable} min-h-screen bg-[#F3F5F7] font-(family-name:--font-body) text-slate-900 lg:flex`}
    >
      {toast && (
        <AdminToast
          type={toast.type}
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      )}
      {/* =====================================================
          SIDEBAR (desktop)
      ====================================================== */}
      <aside className="hidden w-64 shrink-0 flex-col bg-[#0B0E13] text-white lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="px-5 pb-6 pt-6">
          <PlateMark />
          <p className="mt-3 text-xs text-slate-500">
            Super administration
          </p>
        </div>

        <nav aria-label="Navigation principale" className="flex-1 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#E63946]/60 ${active
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <Icon aria-hidden="true" className="h-4.5 w-4.5" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {typeof item.count === 'number' && (
                      <span className="text-xs tabular-nums text-slate-500">
                        {item.count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-1 border-t border-white/10 p-4">
          <Link
            href="/admin/finance"
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-400 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-[#E63946]/60"
          >
            <Sparkles aria-hidden="true" className="h-4 w-4 text-amber-400" />
            Abonnements & MRR
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-400 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-[#E63946]/60"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Retour au site
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-400 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-[#E63946]/60 disabled:opacity-50"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            {loggingOut ? 'Déconnexion…' : 'Se déconnecter'}
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* =====================================================
            TOP BAR (mobile / tablette)
        ====================================================== */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
          <div className="flex h-14 items-center justify-between px-4 sm:px-6">
            <div className="origin-left scale-90">
              <PlateMark small />
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Actualiser les données"
              aria-busy={refreshing}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 outline-none transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-[#E63946]/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                aria-hidden="true"
                className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          <nav
            aria-label="Navigation principale"
            className="flex gap-1 overflow-x-auto px-3 pb-2"
          >
            {navItems.map((item) => {
              const active = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#E63946]/50 ${active
                    ? 'bg-[#0B0E13] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </header>

        {/* =====================================================
            CONTENU
        ====================================================== */}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-(family-name:--font-display) text-3xl font-extrabold tracking-[-0.035em] text-[#0B0E13] sm:text-4xl">
                {heading.title}
              </h1>
              <p className="mt-1.5 text-[15px] text-slate-500">
                {heading.subtitle}
              </p>
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              {lastRefresh && (
                <span className="text-xs text-slate-500">
                  Actualisé à{' '}
                  {lastRefresh.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                aria-busy={refreshing}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#E63946]/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  aria-hidden="true"
                  className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                />
                Actualiser
              </button>
            </div>
          </div>

          {error && (
            <ErrorBanner message={error} onRetry={handleRefresh} retrying={refreshing} />
          )}

          {/* ===============================================
              VUE GLOBALE
          ================================================ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {pendingAgencies.length > 0 && (
                <div
                  role="status"
                  className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p>
                    <strong>{pendingAgencies.length}</strong> agence
                    {pendingAgencies.length > 1 ? 's' : ''} en attente de vérification.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAgencyFilter('PENDING');
                      setActiveTab('agencies');
                    }}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-amber-300 bg-white px-3 font-medium hover:bg-amber-100"
                  >
                    Traiter maintenant
                  </button>
                </div>
              )}

              {/* Registre financier : Monétisation Abonnements & Volume */}
              <section
                aria-labelledby="ledger-title"
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 mb-2">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                        Monétisation Abonnements · 0% de commission
                      </div>
                      <h2
                        id="ledger-title"
                        className="text-sm font-medium text-slate-500"
                      >
                        Revenu Récurrent Mensuel (MRR Plateforme)
                      </h2>
                      <p className="mt-2 font-(family-name:--font-display) text-5xl font-extrabold tracking-[-0.045em] tabular-nums text-[#0B0E13] sm:text-6xl">
                        {formatPrice(subscriptionData?.stats?.monthlyRecurringRevenue ?? 0)}
                        <span className="text-base font-normal text-slate-500 ml-2">/ mois</span>
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        généré par les forfaits mensuels de capacité flotte souscrits par les agences
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('subscriptions')}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0B1220] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-slate-800 transition self-start sm:self-auto"
                    >
                      <Sparkles className="h-4 w-4 text-amber-300" />
                      Gérer les forfaits agences
                    </button>
                  </div>

                  {/* Volume marketplace & Transparence */}
                  <dl className="mt-8 grid gap-4 sm:grid-cols-2 pt-6 border-t border-slate-100">
                    <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
                      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                      <div>
                        <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Volume brut des réservations (100% agences)
                        </dt>
                        <dd className="text-2xl font-black tabular-nums text-[#0B0E13] mt-1">
                          {formatPrice(stats.totalVolume)}
                        </dd>
                        <p className="text-xs text-emerald-700 font-medium mt-0.5">
                          0 DH de commission prélevé · Revenus directement conservés par les loueurs
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
                      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#0B1220]" />
                      <div>
                        <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Agences souscrites & Flotte autorisée
                        </dt>
                        <dd className="text-2xl font-black tabular-nums text-[#0B0E13] mt-1">
                          {subscriptionData?.stats?.activeSubscribers ?? 0} agences · {subscriptionData?.stats?.fleetCapacityTotal ?? 0} véhicules
                        </dd>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Capacité de flotte régionale allouée sous licence active
                        </p>
                      </div>
                    </div>
                  </dl>
                </div>

                <dl className="grid grid-cols-1 divide-y divide-slate-200 border-t border-slate-200 bg-slate-50/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  <Stat
                    icon={Building2}
                    label="Agences vérifiées"
                    value={`${stats.verifiedAgencies} / ${stats.totalAgencies}`}
                    hint={`${verificationRate} % du réseau`}
                  />
                  <Stat
                    icon={Car}
                    label="Véhicules référencés"
                    value={String(stats.totalVehicles)}
                    hint="Flotte de la marketplace"
                  />
                  <Stat
                    icon={CalendarDays}
                    label="Réservations"
                    value={String(stats.totalBookings)}
                    hint={`${confirmedBookings} confirmées`}
                  />
                </dl>
              </section>

              <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                {/* Réservations récentes */}
                <section
                  aria-labelledby="recent-title"
                  className="rounded-xl border border-slate-200 bg-white"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
                    <h2
                      id="recent-title"
                      className="font-(family-name:--font-display) text-lg font-bold tracking-tight"
                    >
                      Aperçu des réservations
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('bookings')}
                      className="rounded-md text-sm font-medium text-[#C42B38] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#E63946]/50"
                    >
                      Tout voir
                    </button>
                  </div>

                  {allBookings.length === 0 ? (
                    <EmptyState
                      title="Aucune réservation pour l'instant"
                      text="Les réservations des clients apparaîtront ici."
                    />
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {allBookings.slice(0, 5).map((booking) => (
                        <li
                          key={booking.id}
                          className="flex items-center gap-4 px-5 py-3.5 sm:px-6"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {booking.customer_name}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {booking.vehicle?.brand}{' '}
                              {booking.vehicle?.model} ·{' '}
                              {booking.agency?.name}
                            </p>
                          </div>
                          <span className="hidden text-sm font-semibold tabular-nums text-slate-900 sm:block">
                            {formatPrice(booking.total_price)}
                          </span>
                          <Badge variant={bookingBadgeVariant(booking.status)}>
                            {BOOKING_STATUS_LABEL[booking.status] ??
                              booking.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <div className="space-y-6">
                  {/* Statuts */}
                  <section
                    aria-labelledby="status-title"
                    className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
                  >
                    <h2
                      id="status-title"
                      className="font-(family-name:--font-display) text-lg font-bold tracking-tight"
                    >
                      Statut des réservations
                    </h2>

                    <div className="mt-5 space-y-4">
                      <StatusBar
                        label="Confirmées"
                        value={confirmedBookings}
                        total={allBookings.length}
                        color="bg-emerald-500"
                      />
                      <StatusBar
                        label="En attente"
                        value={pendingBookings}
                        total={allBookings.length}
                        color="bg-amber-400"
                      />
                      <StatusBar
                        label="Autres"
                        value={otherBookings}
                        total={allBookings.length}
                        color="bg-slate-400"
                      />
                    </div>
                  </section>

                  {/* Contrôles */}
                  <section
                    aria-labelledby="health-title"
                    className="rounded-xl border border-slate-200 bg-white"
                  >
                    <h2
                      id="health-title"
                      className="border-b border-slate-200 px-5 py-4 font-(family-name:--font-display) text-lg font-bold tracking-tight sm:px-6"
                    >
                      Contrôles de la plateforme
                    </h2>

                    <ul className="divide-y divide-slate-100">
                      {health &&
                        Object.entries(health.checks).map(([key, value]) => (
                          <li
                            key={key}
                            className="flex items-center gap-3 px-5 py-3.5 sm:px-6"
                          >
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${value === 'error'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-emerald-50 text-emerald-700'
                                }`}
                            >
                              <Activity aria-hidden="true" className="h-4 w-4" />
                            </div>
                            <p className="flex-1 text-sm font-semibold capitalize text-slate-900">
                              {key === 'app' ? 'Application' : key === 'database' ? 'Base de données' : key}
                            </p>
                            <span
                              className={`text-xs font-medium ${value === 'error' ? 'text-red-700' : 'text-emerald-700'
                                }`}
                            >
                              {HEALTH_LABEL[value] ?? value}
                            </span>
                          </li>
                        ))}
                      <HealthItem
                        icon={ShieldCheck}
                        title="Anti-doublons"
                        description="Détecte les conflits de réservation"
                      />
                      <HealthItem
                        icon={Building2}
                        title="Alternative multi-agences"
                        description="Propose un autre véhicule si indisponible"
                      />
                      <HealthItem
                        icon={Users}
                        title="Demandes WhatsApp"
                        description="Suivi des contacts directs"
                      />
                    </ul>
                  </section>
                </div>
              </div>
            </div>
          )}

          {/* ===============================================
              AGENCES
          ================================================ */}
          {activeTab === 'agencies' && (
            <section aria-label="Liste des agences">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">Validation rapide des agences partenaires.</p>
                <Link
                  href="/admin/agencies"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0B1220] px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1220]"
                >
                  <Building2 className="h-4 w-4" aria-hidden="true" />
                  Gestion centralisée
                </Link>
              </div>
              <SearchField
                value={agencySearch}
                onChange={setAgencySearch}
                placeholder="Rechercher par nom, e-mail ou téléphone"
                label="Rechercher une agence"
              />

              <div
                role="group"
                aria-label="Filtrer par statut d'agence"
                className="mt-3 inline-flex flex-wrap rounded-lg border border-slate-300 bg-white p-0.5"
              >
                {(
                  [
                    ['ALL', 'Toutes'],
                    ['PENDING', 'En attente'],
                    ['ACTIVE', 'Actives'],
                    ['SUSPENDED', 'Suspendues'],
                  ] as [AgencyFilter, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAgencyFilter(value)}
                    aria-pressed={agencyFilter === value}
                    className={`rounded-md px-3.5 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#E63946]/50 ${agencyFilter === value
                      ? 'bg-[#0B0E13] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-225 text-left text-sm">
                    <caption className="sr-only">
                      Agences partenaires de CarDrive
                    </caption>
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <Th>Agence</Th>
                        <Th>Contact</Th>
                        <Th>Adresse</Th>
                        <Th>Flotte</Th>
                        <Th>Forfait</Th>
                        <Th>Statut</Th>
                        <Th align="right">Action</Th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {paginatedAgencies.map((agency) => {
                        const carCount = agency.vehicle_count ?? 0;
                        const isVerifying = verifyingAgencyId === agency.id;

                        return (
                          <tr
                            key={agency.id}
                            className="transition-colors hover:bg-slate-50/70"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  aria-hidden="true"
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0B0E13] font-(family-name:--font-display) text-base font-bold text-white"
                                >
                                  {agency.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {agency.name}
                                  </p>
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {agency.slug}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-slate-800">{agency.phone}</p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {agency.email}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <span className="inline-flex items-start gap-1.5 text-slate-600">
                                <MapPin
                                  aria-hidden="true"
                                  className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                                />
                                {agency.address}
                              </span>
                            </td>

                            <td className="px-5 py-4 tabular-nums text-slate-700">
                              <span className="font-semibold text-slate-900">
                                {carCount}
                              </span>{' '}
                              véhicule{carCount > 1 ? 's' : ''}
                            </td>

                            <td className="px-5 py-4">
                              {(() => {
                                const sub = subscriptionData?.subscriptions.find(
                                  (s) => s.agency_id === agency.id
                                );
                                if (!sub) {
                                  return (
                                    <span className="text-xs text-slate-400">Non abonné</span>
                                  );
                                }
                                return (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#0B1220] border border-blue-200">
                                    <Sparkles className="h-3 w-3 text-amber-500" />
                                    {sub.plan.name}
                                  </span>
                                );
                              })()}
                            </td>

                            <td className="px-5 py-4">
                              <Badge
                                variant={
                                  agency.status === 'ACTIVE'
                                    ? 'available'
                                    : 'rented'
                                }
                              >
                                {AGENCY_STATUS_LABEL[agency.status] ??
                                  agency.status}
                              </Badge>
                            </td>

                            <td className="px-5 py-4 text-right">
                              {agency.verified ? (
                                <button
                                  type="button"
                                  disabled={isVerifying}
                                  onClick={() => handleVerifyAgency(agency, false)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 outline-none transition-colors hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400/50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isVerifying ? (
                                    <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <XCircle aria-hidden="true" className="h-4 w-4" />
                                  )}
                                  Révoquer
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isVerifying}
                                  onClick={() => handleVerifyAgency(agency, true)}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B0E13] px-3 py-2 text-sm font-medium text-white outline-none transition-colors hover:bg-[#1B2230] focus-visible:ring-2 focus-visible:ring-[#E63946]/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isVerifying ? (
                                    <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                                  )}
                                  Vérifier
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredAgencies.length === 0 && (
                  <EmptyState
                    title="Aucune agence trouvée"
                    text={
                      agencySearch
                        ? 'Essayez un autre nom, e-mail ou numéro.'
                        : "Les agences partenaires apparaîtront ici une fois inscrites."
                    }
                  />
                )}
              </div>

              {filteredAgencies.length > TABLE_PAGE_SIZE && (
                <TablePagination
                  page={agencyPage}
                  pageCount={agencyPageCount}
                  onPageChange={setAgencyPage}
                  label="agences"
                />
              )}
            </section>
          )}

          {/* ===============================================
              ABONNEMENTS & MONÉTISATION
          ================================================ */}
          {activeTab === 'subscriptions' && (
            <section aria-label="Gestion des abonnements et des flottes" className="space-y-6">
              {/* Cartes KPI Abonnements */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      MRR Plateforme
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <TrendingUp className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 font-(family-name:--font-display) text-3xl font-extrabold tracking-tight text-slate-900">
                    {formatPrice(subscriptionData?.stats?.monthlyRecurringRevenue ?? 0)}
                    <span className="text-xs font-normal text-slate-500 ml-1">/ mois</span>
                  </p>
                  <p className="mt-1 text-xs text-emerald-600 font-semibold">
                    Revenu récurrent des forfaits
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Agences sous forfait
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0B1220]">
                      <Building2 className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 font-(family-name:--font-display) text-3xl font-extrabold tracking-tight text-slate-900">
                    {subscriptionData?.stats?.activeSubscribers ?? 0}
                    <span className="text-xs font-normal text-slate-500 ml-1">
                      / {agencies.length} agences
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Taux d’adoption :{' '}
                    {agencies.length > 0
                      ? Math.round(
                        ((subscriptionData?.stats?.activeSubscribers ?? 0) / agencies.length) * 100
                      )
                      : 0}{' '}
                    %
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Capacité totale flotte
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Car className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 font-(family-name:--font-display) text-3xl font-extrabold tracking-tight text-slate-900">
                    {subscriptionData?.stats?.fleetCapacityTotal ?? 0}
                    <span className="text-xs font-normal text-slate-500 ml-1">véhicules</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Quota total souscrit sur la région
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Modèle de commission
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 font-(family-name:--font-display) text-3xl font-extrabold tracking-tight text-slate-900">
                    0.00 %
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    100% reversé aux agences partenaires
                  </p>
                </div>
              </div>

              {/* Filtres & Recherche */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <SearchField
                  value={subSearch}
                  onChange={setSubSearch}
                  placeholder="Rechercher par agence ou formule…"
                  label="Rechercher un abonnement"
                />

                <div
                  role="group"
                  aria-label="Filtrer par formule"
                  className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 overflow-x-auto"
                >
                  {[
                    ['ALL', 'Toutes'],
                    ['starter', 'Starter (1-5)'],
                    ['pro', 'Pro (6-15)'],
                    ['business', 'Business (16-30)'],
                    ['unlimited', 'Illimité (31+)'],
                  ].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSubFilter(val)}
                      className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium outline-none transition-colors ${subFilter === val
                        ? 'bg-[#0B0E13] text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tableau des abonnements agences */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-237.5 text-left text-sm">
                    <caption className="sr-only">Abonnements des concessions CarDrive</caption>
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <Th>Agence partenaire</Th>
                        <Th>Formule CarDrive</Th>
                        <Th>Capacité du parc</Th>
                        <Th>Tarif mensuel</Th>
                        <Th>Statut</Th>
                        <Th>Échéance cycle</Th>
                        <Th align="right">Gestion</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedSubscriptions.map((sub) => {
                        const isUnlimited = sub.vehicle_capacity === null;
                        const isOver = sub.is_at_capacity;
                        return (
                          <tr key={sub.id} className="transition-colors hover:bg-slate-50/70">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B0E13] text-sm font-bold text-white font-(family-name:--font-display)">
                                  {sub.agency_name?.charAt(0) ?? 'A'}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">{sub.agency_name}</p>
                                  <p className="text-xs text-slate-500">ID: {sub.agency_id.slice(0, 8)}…</p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border ${sub.plan.slug === 'pro'
                                  ? 'bg-blue-50 text-[#0B1220] border-blue-200'
                                  : sub.plan.slug === 'business'
                                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                                    : sub.plan.slug === 'unlimited'
                                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                                      : 'bg-slate-50 text-slate-700 border-slate-200'
                                  }`}
                              >
                                <Sparkles className="h-3 w-3 text-amber-500" />
                                {sub.plan.name}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs font-semibold">
                                  <span className="text-slate-900">
                                    {sub.current_vehicles_count} / {isUnlimited ? '∞' : `${sub.vehicle_capacity}`}
                                  </span>
                                  {!isUnlimited && (
                                    <span className={isOver ? 'text-red-600' : 'text-slate-500'}>
                                      {sub.capacity_usage_pct}%
                                    </span>
                                  )}
                                </div>
                                {!isUnlimited && (
                                  <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className={`h-full rounded-full transition-all ${isOver ? 'bg-red-500' : 'bg-[#0B1220]'
                                        }`}
                                      style={{ width: `${Math.min(100, sub.capacity_usage_pct)}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="px-5 py-4 font-bold text-slate-900 tabular-nums">
                              {formatPrice(sub.price_monthly)}
                              <span className="text-xs font-normal text-slate-500"> / mois</span>
                            </td>

                            <td className="px-5 py-4">
                              <Badge variant={sub.status === 'ACTIVE' ? 'available' : 'pending'}>
                                {sub.status === 'ACTIVE'
                                  ? 'Actif'
                                  : sub.status === 'TRIAL'
                                    ? 'Période d’essai'
                                    : sub.status}
                              </Badge>
                            </td>

                            <td className="px-5 py-4 text-xs text-slate-600 tabular-nums">
                              {sub.billing_cycle_end}
                              <span className="block text-[11px] text-slate-400">
                                {sub.days_remaining > 0 ? `${sub.days_remaining} jours restants` : 'À renouveler'}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAgencySub(sub);
                                  setNewPlanSlug(sub.plan.slug);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0B1220] transition shadow-xs"
                              >
                                Modifier
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredSubscriptions.length === 0 && (
                  <EmptyState
                    title="Aucun abonnement trouvé"
                    text={
                      subSearch
                        ? 'Essayez avec un autre nom d’agence.'
                        : 'Aucune agence ne correspond à ce filtre.'
                    }
                  />
                )}
              </div>

              {filteredSubscriptions.length > TABLE_PAGE_SIZE && (
                <TablePagination
                  page={subPage}
                  pageCount={subPageCount}
                  onPageChange={setSubPage}
                  label="abonnements"
                />
              )}
            </section>
          )}

          {/* ===============================================
              RÉSERVATIONS
          ================================================ */}
          {activeTab === 'bookings' && (
            <section aria-label="Liste des réservations">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <SearchField
                  value={bookingSearch}
                  onChange={setBookingSearch}
                  placeholder="Dossier, client ou agence"
                  label="Rechercher une réservation"
                />

                <div
                  role="group"
                  aria-label="Filtrer par statut"
                  className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5"
                >
                  {(
                    [
                      ['ALL', 'Toutes'],
                      ['CONFIRMED', 'Confirmées'],
                      ['PENDING', 'En attente'],
                    ] as [BookingFilter, string][]
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setBookingFilter(value)}
                      aria-pressed={bookingFilter === value}
                      className={`rounded-md px-3.5 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#E63946]/50 ${bookingFilter === value
                        ? 'bg-[#0B0E13] text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => exportBookingsCsv(filteredBookings)}
                  disabled={filteredBookings.length === 0}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#E63946]/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download aria-hidden="true" className="h-4 w-4" />
                  Exporter CSV
                </button>
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-275 text-left text-sm">
                    <caption className="sr-only">
                      Réservations de la marketplace CarDrive
                    </caption>
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <Th>Dossier</Th>
                        <Th>Agence</Th>
                        <Th>Client</Th>
                        <Th>Véhicule</Th>
                        <Th>Période</Th>
                        <Th align="right">Montant (100% agence)</Th>
                        <Th align="center">Commission CarDrive</Th>
                        <Th>Statut</Th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {paginatedBookings.map((booking) => {
                        return (
                          <tr
                            key={booking.id}
                            className="transition-colors hover:bg-slate-50/70"
                          >
                            <td className="px-5 py-4 font-mono text-[13px] font-semibold text-[#0B0E13]">
                              {booking.booking_ref}
                            </td>
                            <td className="px-5 py-4 font-medium text-slate-800">
                              {booking.agency?.name}
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-medium text-slate-900">
                                {booking.customer_name}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {booking.customer_phone}
                              </p>
                            </td>
                            <td className="px-5 py-4 text-slate-700">
                              {booking.vehicle?.brand}{' '}
                              {booking.vehicle?.model}
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 tabular-nums text-slate-600">
                              {booking.start_date}
                              <span
                                aria-label="au"
                                className="mx-1.5 text-slate-300"
                              >
                                →
                              </span>
                              {booking.end_date}
                            </td>
                            <td className="px-5 py-4 text-right font-semibold tabular-nums text-slate-900">
                              {formatPrice(booking.total_price)}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                                0% (0 DH)
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <Badge
                                variant={bookingBadgeVariant(booking.status)}
                              >
                                {BOOKING_STATUS_LABEL[booking.status] ??
                                  booking.status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredBookings.length === 0 && (
                  <EmptyState
                    title="Aucune réservation trouvée"
                    text={
                      bookingSearch || bookingFilter !== 'ALL'
                        ? 'Modifiez la recherche ou le filtre de statut.'
                        : 'Les réservations des clients apparaîtront ici.'
                    }
                  />
                )}
              </div>

              {filteredBookings.length > TABLE_PAGE_SIZE && (
                <TablePagination
                  page={bookingPage}
                  pageCount={bookingPageCount}
                  onPageChange={setBookingPage}
                  label="réservations"
                />
              )}
            </section>
          )}
        </main>
      </div>

      {/* Modal d'affectation de forfait agence par l'administrateur */}
      {editingAgencySub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#E63946]" />
              Modifier le forfait de l’agence
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Agence : <strong>{editingAgencySub.agency_name}</strong>
            </p>

            <div className="mt-5 space-y-3">
              <label className="text-xs font-semibold text-slate-700 block">
                Sélectionnez le nouveau palier de capacité :
              </label>
              {(subscriptionData?.plans ?? []).map((p) => {
                const isSelected = newPlanSlug === p.slug;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setNewPlanSlug(p.slug)}
                    className={`w-full flex items-center justify-between rounded-xl border p-3.5 text-left transition ${isSelected
                      ? 'border-[#0B1220] bg-blue-50/50 ring-2 ring-[#0B1220]/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{p.name}</span>
                        {p.badge && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.max_vehicles ? `Jusqu'à ${p.max_vehicles} véhicules` : 'Illimité'}
                      </p>
                    </div>
                    <span className="text-sm font-black text-[#0B1220]">
                      {formatPrice(p.price_monthly)} / mois
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingAgencySub(null)}
                disabled={updatingPlan}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() =>
                  void handleUpdateAgencyPlan(editingAgencySub.agency_id, newPlanSlug)
                }
                disabled={updatingPlan}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0B1220] px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 transition"
              >
                {updatingPlan && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirmer le forfait
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===========================================================
   COMPOSANTS
=========================================================== */

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-3 px-6 py-5">
      <Icon
        aria-hidden="true"
        className="mt-1 h-4.5 w-4.5 shrink-0 text-slate-400"
      />
      <div>
        <dt className="text-sm text-slate-500">{label}</dt>
        <dd className="mt-0.5 font-(family-name:--font-display) text-2xl font-bold tracking-tight tabular-nums text-[#0B0E13]">
          {value}
        </dd>
        <dd className="mt-0.5 text-xs text-slate-500">{hint}</dd>
      </div>
    </div>
  );
}

function StatusBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold tabular-nums text-slate-900">
          {value}
          <span className="ml-1.5 text-xs font-normal text-slate-400">
            {percent} %
          </span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className={`h-full rounded-full ${color} transition-[width] duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function HealthItem({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <li className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        <Icon aria-hidden="true" className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {description}
        </p>
      </div>
      <span className="text-xs font-medium text-emerald-700">Actif</span>
    </li>
  );
}

function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative w-full md:max-w-sm">
      <label htmlFor={`search-${label}`} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      />
      <input
        id={`search-${label}`}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-[#E63946] focus-visible:ring-2 focus-visible:ring-[#E63946]/30"
      />
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Inbox aria-hidden="true" className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-slate-500">{text}</p>
    </div>
  );
}

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
}) {
  return (
    <th
      scope="col"
      className={`px-5 py-3 text-xs font-medium text-slate-500 ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : ''
        }`}
    >
      {children}
    </th>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-6 px-4 py-10 sm:px-6">
      <div className="h-10 w-64 rounded-lg bg-slate-200" />
      <div className="h-48 rounded-xl bg-slate-200" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-xl bg-slate-200" />
        <div className="h-72 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

function ErrorBanner({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div
      role="alert"
      className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-2">
        <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-white px-3 text-sm font-medium hover:bg-amber-100 disabled:opacity-50"
      >
        {retrying ? 'Actualisation…' : 'Réessayer'}
      </button>
    </div>
  );
}

function AdminToast({
  type,
  message,
  onDismiss,
}: {
  type: 'success' | 'error';
  message: string;
  onDismiss: () => void;
}) {
  const isSuccess = type === 'success';
  return (
    <div
      role="status"
      className={`fixed right-4 top-4 z-50 flex max-w-sm items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg ${isSuccess
        ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
        : 'border-red-200 bg-red-50 text-red-950'
        }`}
    >
      {isSuccess ? (
        <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <p className="flex-1">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="text-xs font-medium underline opacity-80 hover:opacity-100"
      >
        Fermer
      </button>
    </div>
  );
}

function TablePagination({
  page,
  pageCount,
  onPageChange,
  label,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  label: string;
}) {
  return (
    <nav
      aria-label={`Pagination ${label}`}
      className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-600"
    >
      <span>
        Page {page + 1} / {pageCount}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 disabled:opacity-40"
        >
          Précédent
        </button>
        <button
          type="button"
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 disabled:opacity-40"
        >
          Suivant
        </button>
      </div>
    </nav>
  );
}