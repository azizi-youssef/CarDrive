import { NextRequest, NextResponse } from 'next/server';
import { requireAgencyPermissionApi } from '@/lib/auth/access-api';
import { createAdminClient } from '@/lib/supabase/server';
import { commissionService } from '@/lib/services/commission.service';
import { subscriptionService } from '@/lib/services/subscription.service';

type RouteContext = { params: Promise<{ id: string }> };

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id: agencyId } = await context.params;
  const gate = await requireAgencyPermissionApi(agencyId, 'reports.read');
  if (gate.denied) return gate.denied;

  const supabase = await createAdminClient();
  if (!supabase) return failure('Service de base de données indisponible.', 503);

  // Obtenir le taux officiel de commission de la plateforme
  const platformRate = await commissionService.getCommissionRate();

  // Récupérer toutes les réservations de l'agence
  const { data: bookings, error: bErr } = await supabase
    .from('bookings')
    .select(
      'id, booking_ref, reference, customer_name, start_date, end_date, total_days, total_price, commission_rate, commission_amount, agency_amount, status, commission_status, created_at, vehicle:vehicles(brand, model)'
    )
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  if (bErr) {
    console.error('[AgencyFinances] Fetch error:', bErr.message);
    return failure('Impossible de charger les données financières.', 500);
  }

  const allBookings = bookings ?? [];

  // Filtrer les réservations qui comptent dans les revenus : CONFIRMED, ACTIVE, COMPLETED
  const revenueEligible = allBookings.filter((b) =>
    ['CONFIRMED', 'APPROVED', 'ACTIVE', 'COMPLETED', 'READY_FOR_PICKUP'].includes(b.status)
  );

  let grossRevenue = 0;
  let platformCommission = 0;
  let agencyNet = 0;

  let settledGross = 0;
  let settledCommission = 0;
  let settledNet = 0;

  for (const b of revenueEligible) {
    const total = Number(b.total_price) || 0;
    const rate = Number(b.commission_rate) || platformRate;
    const commission = Number(b.commission_amount) || (total * rate) / 100;
    const net = Number(b.agency_amount) || total - commission;

    grossRevenue += total;
    platformCommission += commission;
    agencyNet += net;

    if (b.status === 'COMPLETED' || b.commission_status === 'PAID') {
      settledGross += total;
      settledCommission += commission;
      settledNet += net;
    }
  }

  const pendingNet = agencyNet - settledNet;
  const subscription = await subscriptionService.getAgencySubscription(agencyId);

  return NextResponse.json({
    success: true,
    data: {
      platformRate,
      subscription,
      kpis: {
        grossRevenue,
        platformCommission,
        agencyNet,
        settledNet,
        pendingNet,
        totalBookingsCount: revenueEligible.length,
        completedBookingsCount: allBookings.filter((b) => b.status === 'COMPLETED').length,
      },
      transactions: allBookings.map((b) => {
        const total = Number(b.total_price) || 0;
        const rate = Number(b.commission_rate) || platformRate;
        const commission = Number(b.commission_amount) || (total * rate) / 100;
        const net = Number(b.agency_amount) || total - commission;

        return {
          id: b.id,
          reference: b.reference || b.booking_ref || b.id,
          date: b.created_at,
          customerName: b.customer_name,
          vehicle: b.vehicle ? `${(b.vehicle as any).brand} ${(b.vehicle as any).model}` : 'Véhicule',
          totalPrice: total,
          commissionRate: rate,
          commissionAmount: commission,
          agencyAmount: net,
          status: b.status,
          commissionStatus: b.commission_status || 'PENDING',
        };
      }),
    },
  });
}
