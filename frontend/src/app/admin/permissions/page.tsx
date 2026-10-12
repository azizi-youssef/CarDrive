import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminCard } from '@/components/admin/AdminUI';
import { Shield } from 'lucide-react';

export const metadata: Metadata = { title: 'Permissions' };

export default function AdminPermissionsPage() {
  return (
    <AdminShell title="Permissions & RBAC" subtitle="Gestion des rôles et accès CarDrive">
      <AdminCard className="max-w-2xl">
        <h2 className="font-semibold text-slate-900 mb-4">Matrice des rôles</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-2 pr-4 text-left text-xs font-semibold text-slate-500">Permission</th>
                {['SUPER_ADMIN', 'AGENCY_OWNER', 'AGENCY_MANAGER', 'AGENCY_AGENT'].map((r) => (
                  <th key={r} className="py-2 px-3 text-center text-xs font-semibold text-slate-500">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { perm: 'Voir toutes les réservations', rights: [true, false, false, false] },
                { perm: 'Gérer les agences', rights: [true, false, false, false] },
                { perm: 'Modifier la commission', rights: [true, false, false, false] },
                { perm: 'Réservations agence', rights: [true, true, true, false] },
                { perm: 'Flotte agence', rights: [true, true, true, true] },
                { perm: 'Voir ses réservations', rights: [true, true, true, true] },
              ].map(({ perm, rights }) => (
                <tr key={perm}>
                  <td className="py-2.5 pr-4 text-slate-700">{perm}</td>
                  {rights.map((r, i) => (
                    <td key={i} className="py-2.5 px-3 text-center">
                      {r ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminShell>
  );
}
