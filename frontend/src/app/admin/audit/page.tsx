import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminAuditClient } from '@/components/admin/audit/AdminAuditClient';

export const metadata: Metadata = { title: 'Audit Logs' };

export default function AdminAuditPage() {
  return (
    <AdminShell title="Audit Logs" subtitle="Historique des opérations sensibles de la plateforme">
      <AdminAuditClient />
    </AdminShell>
  );
}
