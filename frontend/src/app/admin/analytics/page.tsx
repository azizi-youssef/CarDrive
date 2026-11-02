import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminAnalyticsClient } from '@/components/admin/analytics/AdminAnalyticsClient';

export const metadata: Metadata = { title: 'Analytics & Performance | CarDrive Admin' };

export default function AdminAnalyticsPage() {
  return (
    <AdminShell
      title="Analytics & Performance"
      subtitle="Indicateurs clés d'activité, performances opérationnelles et tendances de réservation"
    >
      <AdminAnalyticsClient />
    </AdminShell>
  );
}
