import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminFleetClient } from '@/components/admin/fleet/AdminFleetClient';

export const metadata: Metadata = { title: 'Voitures' };

export default function AdminFleetPage() {
  return (
    <AdminShell title="Voitures" subtitle="Voitures référencées sur la marketplace">
      <AdminFleetClient vehicleType="CAR" />
    </AdminShell>
  );
}
