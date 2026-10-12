import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminCard } from '@/components/admin/AdminUI';
import { Bell } from 'lucide-react';

export const metadata: Metadata = { title: 'Notifications' };

export default function AdminNotificationsPage() {
  return (
    <AdminShell title="Notifications" subtitle="Gestion des notifications de la plateforme">
      <AdminCard className="max-w-lg">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="rounded-full bg-slate-100 p-4">
            <Bell className="h-7 w-7 text-slate-400" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Centre de notifications</h2>
            <p className="mt-1 text-sm text-slate-500 max-w-xs">
              Configurez les modèles WhatsApp, email, et les règles d'envoi automatique.
              Module disponible dans la prochaine version.
            </p>
          </div>
        </div>
      </AdminCard>
    </AdminShell>
  );
}
