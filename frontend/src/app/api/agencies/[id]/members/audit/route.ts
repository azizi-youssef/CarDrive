import { NextRequest, NextResponse } from 'next/server';
import { requireAgencyPermissionApi } from '@/lib/auth/access-api';
import { createClient } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id: agencyId } = await context.params;
  const gate = await requireAgencyPermissionApi(agencyId, 'members.read');
  if (gate.denied) return gate.denied;
  const page = Math.max(1, Number.parseInt(request.nextUrl.searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(request.nextUrl.searchParams.get('pageSize') ?? '20', 10) || 20));
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Service de données indisponible.' }, { status: 503 });
  }

  const start = (page - 1) * pageSize;
  const { data, error, count } = await supabase
    .from('audit_logs')
    .select('id, user_id, action, entity_type, entity_id, metadata, result, created_at', { count: 'exact' })
    .eq('agency_id', agencyId)
    .in('entity_type', ['agency_member', 'agency'])
    .order('created_at', { ascending: false })
    .range(start, start + pageSize - 1);
  if (error) {
    console.error('[AgencyAccessAudit] Listing failed:', error.message);
    return NextResponse.json({ success: false, error: 'Impossible de charger l’historique des accès.' }, { status: 500 });
  }
  return NextResponse.json({
    success: true,
    data: data ?? [],
    meta: { page, pageSize, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / pageSize) },
  });
}
