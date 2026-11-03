import { NextRequest, NextResponse } from 'next/server';
import { serverError } from '@/lib/api/server-error';
import { getServerAuth } from '@/lib/auth/server';
import { commissionService } from '@/lib/services/commission.service';

export async function GET() {
  try {
    const settings = await commissionService.getPlatformSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: unknown) {
    return serverError(error, '/api/settings/commission', 'Paramètres de commission indisponibles.');
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuth();
    if (!auth || auth.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    const body = await req.json();
    const rate = Number(body.commission_rate ?? body.rate);

    if (isNaN(rate) || rate < 0 || rate > 100) {
      return NextResponse.json(
        { success: false, error: 'Taux de commission invalide (doit être entre 0% et 100%)' },
        { status: 400 }
      );
    }

    const result = await commissionService.updateCommissionRate(rate);
    return NextResponse.json(result, { status: result.success ? 200 : 503 });
  } catch (error: unknown) {
    return serverError(error, '/api/settings/commission', 'Paramètres de commission indisponibles.');
  }
}
