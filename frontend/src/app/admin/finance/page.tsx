import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminFinanceClient } from '@/components/admin/finance/AdminFinanceClient';
import { commissionService } from '@/lib/services/commission.service';

export const metadata: Metadata = { title: 'Abonnements & Finances | CarDrive Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminFinancePage() {
  let commissionRate = 0;
  try {
    const settings = await commissionService.getPlatformSettings();
    commissionRate = settings.commission_rate;
  } catch { /* use default */ }

  return (
    <AdminShell
      title="Abonnements & Finances"
      subtitle="Revenus récurrents des abonnements mensuels (MRR), capacité des flottes et volume des concessions"
    >
      <AdminFinanceClient commissionRate={commissionRate} />
    </AdminShell>
  );
}
