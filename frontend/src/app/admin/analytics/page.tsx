import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminAnalyticsClient } from '@/components/admin/analytics/AdminAnalyticsClient';

export const metadata: Metadata = { title: 'Analytics & Rapports' };

export default function AdminAnalyticsPage() {
  return (
    <AdminShell
      title="Analytics & Performance"
      subtitle="Indicateurs clés d'activité, volume financier et tendances de réservation"
    >
      <AdminAnalyticsClient />
    </AdminShell>
  );
}
