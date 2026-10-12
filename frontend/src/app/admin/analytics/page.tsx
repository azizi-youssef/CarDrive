import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminCard } from '@/components/admin/AdminUI';
import { BarChart3 } from 'lucide-react';

export const metadata: Metadata = { title: 'Analytics' };

export default function AdminAnalyticsPage() {
  return (
    <AdminShell title="Analytics & Rapports" subtitle="Statistiques avancées de la marketplace">
      <AdminCard className="max-w-lg">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="rounded-full bg-slate-100 p-4">
            <BarChart3 className="h-7 w-7 text-slate-400" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Analytics avancés — bientôt disponible</h2>
            <p className="mt-1 text-sm text-slate-500 max-w-xs">
              Tendances de réservation, performance par agence, occupation saisonnière.
              Les KPIs principaux sont disponibles dans la Vue d'ensemble.
            </p>
          </div>
        </div>
      </AdminCard>
    </AdminShell>
  );
}
