import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminFinanceClient } from '@/components/admin/finance/AdminFinanceClient';
import { commissionService } from '@/lib/services/commission.service';

export const metadata: Metadata = { title: 'Commissions & Finance' };

export default async function AdminFinancePage() {
  let commissionRate = 15;
  try {
    const settings = await commissionService.getPlatformSettings();
    commissionRate = settings.commission_rate;
  } catch { /* use default */ }

  return (
    <AdminShell title="Commissions & Finance" subtitle="Suivi des commissions et revenus de la plateforme">
      <AdminFinanceClient commissionRate={commissionRate} />
    </AdminShell>
  );
}
