import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminAuditClient } from '@/components/admin/audit/AdminAuditClient';

export const metadata: Metadata = { title: 'Journal d’audit' };

export default function AdminAuditPage() {
  return (
    <AdminShell title="Journal d’audit" subtitle="Historique des opérations sensibles de la plateforme">
      <AdminAuditClient />
    </AdminShell>
  );
}
