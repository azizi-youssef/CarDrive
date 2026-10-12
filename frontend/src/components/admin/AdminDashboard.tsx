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
  Database,
  Activity,
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
import type { Agency, Booking } from '@/types';

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

type Tab = 'overview' | 'agencies' | 'bookings';
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
    'Montant',
    'Commission',
    'Net agence',
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
      b.commission_amount,
      b.agency_amount,
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
      <div className={`relative ${small ? 'h-7 w-[125px]' : 'h-9 w-[150px]'}`}>
        <Image
          src="/logo-CarDrive2.png"
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
        const [statsData, agenciesData, bookingsData, commissionPct, healthData] =
          await Promise.all([
            fetchAdminStats(),
            fetchAdminAgencies(),
            fetchAdminBookings(),
            fetchCommissionRatePct(),
            fetchHealth(),
          ]);

        if (controller.signal.aborted) return;
        setHealth(healthData);

        setStats(statsData);
        setAgencies(agenciesData);
        setAllBookings(bookingsData);
        if (commissionPct != null) setCommissionRatePct(commissionPct);
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
        className={`${displayFont.variable} ${bodyFont.variable} min-h-screen bg-[#F3F5F7] font-[family-name:var(--font-body)] text-slate-900`}
      >
        <AdminDashboardSkeleton />
      </div>
    );
  }

  return (
    <div
      className={`${displayFont.variable} ${bodyFont.variable} min-h-screen bg-[#F3F5F7] font-[family-name:var(--font-body)] text-slate-900 lg:flex`}
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
                    <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
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
            href="/admin/settings/commission"
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-400 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-[#E63946]/60"
          >
            <Database aria-hidden="true" className="h-4 w-4" />
            Commission
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
        <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[-0.035em] text-[#0B0E13] sm:text-4xl">
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

              {/* Registre financier : l'élément signature */}
              <section
                aria-labelledby="ledger-title"
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="p-6 sm:p-8">
                  <h2
                    id="ledger-title"
                    className="text-sm font-medium text-slate-500"
                  >
                    Volume d'affaires
                  </h2>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-5xl font-extrabold tracking-[-0.045em] tabular-nums text-[#0B0E13] sm:text-6xl">
                    {formatPrice(stats.totalVolume)}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    sur {stats.totalBookings} réservation
                    {stats.totalBookings > 1 ? 's' : ''}
                  </p>

                  {/* Répartition commission / agences */}
                  <div
                    role="img"
                    aria-label={`Répartition : CarDrive ${commissionLabel}, agences ${agencyShareLabel}`}
                    className="mt-8 flex h-3 overflow-hidden rounded-full bg-[#0B0E13]"
                  >
                    <div
                      className="h-full bg-[#E63946] transition-[width] duration-500"
                      style={{ width: `${commissionShare}%` }}
                    />
                  </div>

                  <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#E63946]" />
                      <div>
                        <dt className="text-sm text-slate-500">
                          Revenus CarDrive · commission {commissionLabel}
                        </dt>
                        <dd className="text-xl font-bold tabular-nums text-[#0B0E13]">
                          {formatPrice(stats.platformCommission)}
                        </dd>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#0B0E13]" />
                      <div>
                        <dt className="text-sm text-slate-500">
                          Revenu net des agences · {agencyShareLabel}
                        </dt>
                        <dd className="text-xl font-bold tabular-nums text-[#0B0E13]">
                          {formatPrice(agencyNet)}
                        </dd>
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
                      className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight"
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
                      className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight"
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
                      className="border-b border-slate-200 px-5 py-4 font-[family-name:var(--font-display)] text-lg font-bold tracking-tight sm:px-6"
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
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                value === 'error'
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
                              className={`text-xs font-medium ${
                                value === 'error' ? 'text-red-700' : 'text-emerald-700'
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
                  className="inline-flex items-center gap-2 rounded-xl bg-[#02306B] px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#02306B]"
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
                    className={`rounded-md px-3.5 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#E63946]/50 ${
                      agencyFilter === value
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
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <caption className="sr-only">
                      Agences partenaires de CarDrive
                    </caption>
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <Th>Agence</Th>
                        <Th>Contact</Th>
                        <Th>Adresse</Th>
                        <Th>Flotte</Th>
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
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0B0E13] font-[family-name:var(--font-display)] text-base font-bold text-white"
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
                  <table className="w-full min-w-[1100px] text-left text-sm">
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
                        <Th align="right">Montant</Th>
                        <Th align="right">CarDrive {commissionLabel}</Th>
                        <Th align="right">Agence {agencyShareLabel}</Th>
                        <Th>Statut</Th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {paginatedBookings.map((booking) => {
                        const commission = booking.commission_amount;
                        const netAgency = booking.agency_amount;

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
                            <td className="px-5 py-4 text-right font-semibold tabular-nums text-[#C42B38]">
                              {commission != null ? `+${formatPrice(commission)}` : '—'}
                            </td>
                            <td className="px-5 py-4 text-right tabular-nums text-slate-600">
                              {netAgency != null ? formatPrice(netAgency) : '—'}
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
        className="mt-1 h-[18px] w-[18px] shrink-0 text-slate-400"
      />
      <div>
        <dt className="text-sm text-slate-500">{label}</dt>
        <dd className="mt-0.5 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight tabular-nums text-[#0B0E13]">
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
  align?: 'left' | 'right';
}) {
  return (
    <th
      scope="col"
      className={`px-5 py-3 text-xs font-medium text-slate-500 ${align === 'right' ? 'text-right' : ''
        }`}
    >
      {children}
    </th>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1280px] animate-pulse space-y-6 px-4 py-10 sm:px-6">
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