import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminNotificationsClient } from '@/components/admin/notifications/AdminNotificationsClient';

export const metadata: Metadata = { title: 'Centre de Notifications' };

export default function AdminNotificationsPage() {
  return (
    <AdminShell
      title="Centre de Notifications"
      subtitle="Gestion des alertes WhatsApp Business, diffusion de messages et historique des envois"
    >
      <AdminNotificationsClient />
    </AdminShell>
  );
}
