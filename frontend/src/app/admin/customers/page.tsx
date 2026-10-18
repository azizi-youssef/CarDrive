import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminCustomersClient } from '@/components/admin/customers/AdminCustomersClient';

export const metadata: Metadata = { title: 'Répertoire Clients' };

export default function AdminCustomersPage() {
  return (
    <AdminShell
      title="Répertoire Clients"
      subtitle="Gestion de la base conducteurs, historique des locations et fidélisation"
    >
      <AdminCustomersClient />
    </AdminShell>
  );
}
