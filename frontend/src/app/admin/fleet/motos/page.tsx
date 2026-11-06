import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminFleetClient } from '@/components/admin/fleet/AdminFleetClient';

export const metadata: Metadata = { title: 'Motos' };

export default function AdminMotorcyclesPage() {
  return (
    <AdminShell title="Motos" subtitle="Motos et scooters référencés sur la marketplace">
      <AdminFleetClient vehicleType="MOTORCYCLE" />
    </AdminShell>
  );
}
