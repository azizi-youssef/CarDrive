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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-base font-bold text-slate-900">Analyses désactivées</h2>
      <p className="mt-2 text-sm text-slate-500">Les indicateurs et tableaux de bord financiers ont été retirés du modèle par abonnement.</p>
    </div>
  );
}
