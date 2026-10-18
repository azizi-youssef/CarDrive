import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminPermissionsClient } from '@/components/admin/permissions/AdminPermissionsClient';

export const metadata: Metadata = { title: 'Permissions & RBAC' };

export default function AdminPermissionsPage() {
  return (
    <AdminShell
      title="Permissions & Rôles (RBAC)"
      subtitle="Matrice des privilèges d'accès, gestion des rôles utilisateurs et politique de sécurité"
    >
      <AdminPermissionsClient />
    </AdminShell>
  );
}
