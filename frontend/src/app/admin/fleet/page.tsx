import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminFleetClient } from '@/components/admin/fleet/AdminFleetClient';

export const metadata: Metadata = { title: 'Flotte véhicules' };

export default function AdminFleetPage() {
  return (
    <AdminShell title="Flotte véhicules" subtitle="Tous les véhicules référencés sur la marketplace">
      <AdminFleetClient />
    </AdminShell>
  );
}
