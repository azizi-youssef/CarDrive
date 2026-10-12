import { NextRequest, NextResponse } from 'next/server';
import { requireAgencyPermissionApi } from '@/lib/auth/access-api';
import { statsService } from '@/lib/services/stats.service';

type RouteContext = { params: Promise<{ id: string }> };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const gate = await requireAgencyPermissionApi(id, 'reports.read');
  if (gate.denied) return gate.denied;

  const params = _request.nextUrl.searchParams;
  const from = params.get('from');
  const to = params.get('to');

  if (from !== null && !DATE_PATTERN.test(from)) {
    return NextResponse.json({ success: false, error: 'Date de début invalide.' }, { status: 400 });
  }
  if (to !== null && !DATE_PATTERN.test(to)) {
    return NextResponse.json({ success: false, error: 'Date de fin invalide.' }, { status: 400 });
  }
  if (from && to && from > to) {
    return NextResponse.json({ success: false, error: 'La période est invalide.' }, { status: 400 });
  }

  const range = { from: from ?? undefined, to: to ?? undefined };

  try {
    const [stats, agenda] = await Promise.all([
      statsService.getAgencyDashboardStats(id, range),
      statsService.getAgencyAgenda(id),
    ]);
    return NextResponse.json({ success: true, data: { stats, agenda } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    console.error('[API /api/stats/agency/[id]/dashboard] Error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
