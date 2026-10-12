import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminAgenciesClient } from '@/components/admin/agencies/AdminAgenciesClient';

export const metadata: Metadata = { title: 'Agences' };

export default function AdminAgenciesPage() {
  return (
    <AdminShell title="Agences partenaires" subtitle="Gérez les agences de la marketplace CarDrive">
      <AdminAgenciesClient />
    </AdminShell>
  );
}
