import { NextRequest, NextResponse } from 'next/server';
import { requireAgencyPermissionApi } from '@/lib/auth/access-api';
import { createAdminClient } from '@/lib/supabase/server';
import { agencyCustomerQuerySchema } from '@/lib/validations/agency-access';

type RouteContext = { params: Promise<{ id: string; reference: string }> };
const CUSTOMER_FIELDS =
  'id, booking_ref, reference, customer_id, customer_name, customer_email, customer_phone, start_date, end_date, status, total_price, created_at, vehicle:vehicles(brand, model)';

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id: agencyId, reference } = await context.params;
  const gate = await requireAgencyPermissionApi(agencyId, 'customers.read');
  if (gate.denied) return gate.denied;

  const params = request.nextUrl.searchParams;
  const parsed = agencyCustomerQuerySchema.safeParse({
    page: params.get('page') ?? undefined,
    pageSize: params.get('pageSize') ?? undefined,
    q: '',
  });
  if (!parsed.success) return failure('Paramètres de pagination invalides.', 400);

  const supabase = await createAdminClient();
  if (!supabase) return failure('Service de données sécurisé indisponible.', 503);
  const { data: byLegacyReference, error: legacyError } = await supabase
    .from('bookings')
    .select(CUSTOMER_FIELDS)
    .eq('agency_id', agencyId)
    .eq('booking_ref', reference)
    .maybeSingle();
  if (legacyError) {
    console.error('[AgencyCustomers] Customer dossier lookup failed:', legacyError.message);
    return failure('Impossible de charger ce dossier client.', 500);
  }
  let booking = byLegacyReference;
  if (!booking) {
    const { data, error } = await supabase
      .from('bookings')
      .select(CUSTOMER_FIELDS)
      .eq('agency_id', agencyId)
      .eq('reference', reference)
      .maybeSingle();
    if (error) {
      console.error('[AgencyCustomers] Customer reference lookup failed:', error.message);
      return failure('Impossible de charger ce dossier client.', 500);
    }
    booking = data;
  }
  if (!booking) return failure('Dossier client introuvable.', 404);

  let historyQuery = supabase
    .from('bookings')
    .select(CUSTOMER_FIELDS, { count: 'exact' })
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });
  historyQuery = booking.customer_id
    ? historyQuery.eq('customer_id', booking.customer_id)
    : historyQuery.eq('customer_email', booking.customer_email);
  const start = (parsed.data.page - 1) * parsed.data.pageSize;
  const { data: history, error: historyError, count } = await historyQuery.range(
    start,
    start + parsed.data.pageSize - 1
  );
  if (historyError) {
    console.error('[AgencyCustomers] Customer history lookup failed:', historyError.message);
    return failure('Impossible de charger l’historique des locations.', 500);
  }

  return NextResponse.json({
    success: true,
    data: {
      dossier: booking,
      history: history ?? [],
      meta: {
        page: parsed.data.page,
        pageSize: parsed.data.pageSize,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / parsed.data.pageSize),
      },
    },
  });
}
