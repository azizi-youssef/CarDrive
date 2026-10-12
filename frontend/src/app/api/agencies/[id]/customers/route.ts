import { NextRequest, NextResponse } from 'next/server';
import { requireAgencyPermissionApi } from '@/lib/auth/access-api';
import { createAdminClient } from '@/lib/supabase/server';
import { agencyCustomerQuerySchema } from '@/lib/validations/agency-access';

type RouteContext = { params: Promise<{ id: string }> };

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id: agencyId } = await context.params;
  const gate = await requireAgencyPermissionApi(agencyId, 'customers.read');
  if (gate.denied) return gate.denied;

  const params = request.nextUrl.searchParams;
  const parsed = agencyCustomerQuerySchema.safeParse({
    page: params.get('page') ?? undefined,
    pageSize: params.get('pageSize') ?? undefined,
    q: params.get('q') ?? '',
    status: params.get('status') || undefined,
    from: params.get('from') || undefined,
    to: params.get('to') || undefined,
  });
  if (!parsed.success) {
    return failure(parsed.error.issues.map((issue) => issue.message).join(', '), 400);
  }
  if (parsed.data.from && parsed.data.to && parsed.data.from > parsed.data.to) {
    return failure('La période de recherche est invalide.', 400);
  }

  const supabase = await createAdminClient();
  if (!supabase) return failure('Service de données sécurisé indisponible.', 503);
  const escapedSearch = parsed.data.q.replace(/[\\%_,()]/g, '\\$&');
  let query = supabase
    .from('bookings')
    .select(
      'id, booking_ref, reference, customer_id, customer_name, customer_email, customer_phone, start_date, end_date, status, total_price, created_at, vehicle:vehicles(brand, model)',
      { count: 'exact' }
    )
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  if (parsed.data.status) query = query.eq('status', parsed.data.status);
  if (parsed.data.from) query = query.gte('start_date', parsed.data.from);
  if (parsed.data.to) query = query.lte('end_date', parsed.data.to);
  if (escapedSearch) {
    query = query.or(
      `customer_name.ilike.%${escapedSearch}%,customer_email.ilike.%${escapedSearch}%,customer_phone.ilike.%${escapedSearch}%,booking_ref.ilike.%${escapedSearch}%,reference.ilike.%${escapedSearch}%`
    );
  }
  const start = (parsed.data.page - 1) * parsed.data.pageSize;
  const { data, error, count } = await query.range(start, start + parsed.data.pageSize - 1);
  if (error) {
    console.error('[AgencyCustomers] Listing failed:', error.message);
    return failure('Impossible de charger les dossiers clients.', 500);
  }

  return NextResponse.json({
    success: true,
    data: data ?? [],
    meta: {
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / parsed.data.pageSize),
    },
  });
}
