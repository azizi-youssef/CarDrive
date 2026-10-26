'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  Percent,
  Clock,
  Download,
  RefreshCw,
  Building2,
  Car,
  MapPin,
  CheckCircle2,
  XCircle,
  Award,
} from 'lucide-react';
import { KpiCard, AdminCard, StatusBadge, Btn, ErrorBanner } from '@/components/admin/AdminUI';
import { useRealtimeRefresh } from '@/lib/supabase/realtime';

interface AnalyticsData {
  kpis: {
    totalVolume: number;
    platformCommission: number;
    agencyNet: number;
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    averageBookingPrice: number;
    averageRentalDays: number;
    confirmationRate: number;
    cancellationRate: number;
  };
  monthlyTrends: Array<{
    month: string;
    bookings: number;
    volume: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    volume: number;
    percentage: number;
  }>;
  topAgencies: Array<{
    name: string;
    count: number;
    volume: number;
    rating: number;
  }>;
  topLocations: Array<{
    location: string;
    count: number;
    percentage: number;
  }>;
}

export function AdminAnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/analytics', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erreur lors du chargement des statistiques');
      }
      setData(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Impossible de récupérer les analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData(true);
  }, [loadData]);

  // Rafraîchissement automatique en direct
  useRealtimeRefresh({
    tables: ['bookings', 'vehicles', 'agencies'],
    onRefresh: () => loadData(false),
    pollingIntervalMs: 25_000,
  });

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ['Rapport Analytics CarDrive'],
      ['Date', new Date().toLocaleDateString('fr-FR')],
      [],
      ['KPI', 'Valeur'],
      ['Volume d’affaires brut', `${data.kpis.totalVolume} MAD`],
      ['Commission CarDrive', `${data.kpis.platformCommission} MAD`],
      ['Revenu net agences', `${data.kpis.agencyNet} MAD`],
      ['Total réservations', data.kpis.totalBookings],
      ['Taux de confirmation', `${data.kpis.confirmationRate}%`],
      ['Panier moyen', `${data.kpis.averageBookingPrice} MAD`],
      ['Durée moyenne', `${data.kpis.averageRentalDays} jours`],
      [],
      ['Catégorie', 'Réservations', 'Volume (MAD)', 'Part'],
      ...data.categoryBreakdown.map((c) => [c.category, c.count, c.volume, `${c.percentage}%`]),
      [],
      ['Agence', 'Réservations', 'Volume (MAD)', 'Note'],
      ...data.topAgencies.map((a) => [a.name, a.count, a.volume, a.rating]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cardrive-analytics-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <ErrorBanner
        message={error}
        onRetry={() => loadData(true)}
      />
    );
  }

  const kpis = data?.kpis;
  const maxMonthlyVolume = Math.max(...(data?.monthlyTrends.map((m) => m.volume) || [1]), 1);

  return (
    <div className="space-y-6">
      {/* Barre d'actions supérieure */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Données synchronisées en direct
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Btn
            variant="secondary"
            size="sm"
            onClick={exportCSV}
            className="flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Exporter CSV
          </Btn>
          <Btn
            variant="secondary"
            size="sm"
            onClick={() => loadData(false)}
            disabled={refreshing}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Btn>
        </div>
      </div>

      {/* Grille des KPIs clés */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          label="Volume d'affaires"
          value={`${kpis?.totalVolume.toLocaleString('fr-FR') ?? 0} DH`}
          sub="GMV cumulé"
          icon={DollarSign}
          iconColor="text-blue-600"
        />
        <KpiCard
          label="Commissions"
          value={`${kpis?.platformCommission.toLocaleString('fr-FR') ?? 0} DH`}
          sub="Revenu CarDrive"
          icon={TrendingUp}
          iconColor="text-emerald-600"
        />
        <KpiCard
          label="Net Agences"
          value={`${kpis?.agencyNet.toLocaleString('fr-FR') ?? 0} DH`}
          sub="Reversé partenaires"
          icon={Building2}
          iconColor="text-indigo-600"
        />
        <KpiCard
          label="Panier moyen"
          value={`${kpis?.averageBookingPrice.toLocaleString('fr-FR') ?? 0} DH`}
          sub="Par location"
          icon={BarChart3}
          iconColor="text-violet-600"
        />
        <KpiCard
          label="Durée moyenne"
          value={`${kpis?.averageRentalDays ?? 0} j`}
          sub="Par contrat"
          icon={Clock}
          iconColor="text-amber-600"
        />
        <KpiCard
          label="Confirmation"
          value={`${kpis?.confirmationRate ?? 0}%`}
          sub={`${kpis?.cancelledBookings ?? 0} refus / annulations`}
          icon={Percent}
          iconColor="text-teal-600"
        />
      </div>

      {/* Graphique des tendances mensuelles */}
      <AdminCard>
        <h3 className="text-base font-bold text-slate-900 mb-4">Évolution mensuelle du chiffre d'affaires & réservations</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-56 pt-6">
            {(data?.monthlyTrends || []).map((m, idx) => {
              const heightPct = Math.max(Math.round((m.volume / maxMonthlyVolume) * 100), 8);
              return (
                <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[11px] font-semibold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {m.volume.toLocaleString('fr-FR')} DH
                  </div>
                  <div className="w-full max-w-12 bg-slate-100 rounded-t-lg relative flex items-end overflow-hidden h-40">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-linear-to-t from-[#02306B] to-blue-500 rounded-t-lg transition-all duration-500 group-hover:from-blue-700 group-hover:to-blue-400"
                    />
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-medium text-slate-800">{m.month}</span>
                    <span className="block text-[10px] text-slate-500">{m.bookings} loc.</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AdminCard>

      {/* Double section : Catégories et Points de rencontre */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Répartition par catégorie */}
        <AdminCard>
          <h3 className="text-base font-bold text-slate-900 mb-4">Répartition par catégorie de véhicule</h3>
          <div className="space-y-3">
            {(data?.categoryBreakdown || []).map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Car className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">{cat.category}</span>
                    <span className="text-slate-400">({cat.count} loc.)</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-slate-900 font-bold">{cat.volume.toLocaleString('fr-FR')} DH</span>
                    <span className="text-slate-500 text-[11px]">({cat.percentage}%)</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{ width: `${cat.percentage}%` }}
                    className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  />
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        {/* Points de prise en charge */}
        <AdminCard>
          <h3 className="text-base font-bold text-slate-900 mb-4">Points de prise en charge les plus demandés</h3>
          <div className="space-y-3">
            {(data?.topLocations || []).map((loc, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-white p-2 border border-slate-200">
                    <MapPin className="h-4 w-4 text-[#02306B]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{loc.location}</p>
                    <p className="text-[11px] text-slate-500">{loc.count} réservations</p>
                  </div>
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                  {loc.percentage}%
                </span>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      {/* Top Agences Partenaires */}
      <AdminCard>
        <h3 className="text-base font-bold text-slate-900 mb-4">Top Agences Partenaires par Volume</h3>
        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100">
          {(data?.topAgencies || []).map((agency, idx) => (
            <div key={idx} className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                  idx === 0 ? 'bg-amber-100 text-amber-800' : idx === 1 ? 'bg-slate-200 text-slate-700' : idx === 2 ? 'bg-amber-50 text-amber-900' : 'bg-slate-100 text-slate-600'
                }`}>
                  #{idx + 1}
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{agency.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>★ {agency.rating}</span>
                    <span>•</span>
                    <span>{agency.count} réservations</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#02306B]">{agency.volume.toLocaleString('fr-FR')} DH</p>
                <p className="text-[11px] text-slate-400">Volume généré</p>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
