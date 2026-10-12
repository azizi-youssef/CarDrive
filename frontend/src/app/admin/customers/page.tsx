import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminCard } from '@/components/admin/AdminUI';
import { Users } from 'lucide-react';

export const metadata: Metadata = { title: 'Clients' };

export default function AdminCustomersPage() {
  return (
    <AdminShell title="Clients" subtitle="Base clients de la marketplace CarDrive">
      <AdminCard className="max-w-lg">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="rounded-full bg-slate-100 p-4">
            <Users className="h-7 w-7 text-slate-400" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Module en développement</h2>
            <p className="mt-1 text-sm text-slate-500 max-w-xs">
              La gestion avancée des clients sera disponible dans la prochaine version.
              Les données clients sont accessibles via le module Réservations.
            </p>
          </div>
        </div>
      </AdminCard>
    </AdminShell>
  );
}
