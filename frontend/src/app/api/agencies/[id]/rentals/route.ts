import { NextRequest, NextResponse } from 'next/server';
import { requireAgencyPermissionApi } from '@/lib/auth/access-api';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id: agencyId } = await context.params;
  const gate = await requireAgencyPermissionApi(agencyId, 'bookings.read');
  if (gate.denied) return gate.denied;

  const params = request.nextUrl.searchParams;
  const tab = params.get('tab') || 'all'; // 'pickups', 'returns', 'active', 'all'
  const today = new Date().toISOString().split('T')[0]!;

  const supabase = await createAdminClient();
  if (!supabase) return failure('Service de base de données indisponible.', 503);

  let query = supabase
    .from('bookings')
    .select(
      'id, booking_ref, reference, customer_name, customer_phone, customer_email, cin, start_date, end_date, pickup_time, dropoff_time, status, total_price, deposit_amount, delivery_type, flight_number, vehicle:vehicles(id, brand, model, license_plate, unit_number, mileage, images:vehicle_images(url, is_primary))'
    )
    .eq('agency_id', agencyId)
    .order('start_date', { ascending: true });

  if (tab === 'pickups') {
    // Départs : Confirmés ou prêts pour départ
    query = query.in('status', ['CONFIRMED', 'APPROVED', 'READY_FOR_PICKUP']);
  } else if (tab === 'returns') {
    // Retours : Locations actuellement en cours
    query = query.in('status', ['ACTIVE', 'RENTED']);
  } else if (tab === 'active') {
    // Véhicules actuellement sur les routes
    query = query.eq('status', 'ACTIVE');
  } else {
    // Tout ce qui concerne les opérations terrain
    query = query.in('status', ['CONFIRMED', 'APPROVED', 'READY_FOR_PICKUP', 'ACTIVE', 'COMPLETED']);
  }

  const { data, error } = await query.limit(100);
  if (error) {
    console.error('[AgencyRentals] Fetch error:', error.message);
    return failure('Impossible de charger les départs et retours.', 500);
  }

  const rentals = (data ?? []).map((row: any) => {
    const v = row.vehicle;
    let mainImage = null;
    if (v && Array.isArray(v.images) && v.images.length > 0) {
      const primary = v.images.find((img: any) => img.is_primary);
      mainImage = primary ? primary.url : v.images[0].url;
    }

    const isPickupToday = row.start_date === today;
    const isReturnToday = row.end_date === today;
    const isOverdueReturn = row.end_date < today && row.status === 'ACTIVE';

    return {
      ...row,
      vehicle: v ? {
        id: v.id,
        brand: v.brand,
        model: v.model,
        licensePlate: v.license_plate,
        unitNumber: v.unit_number,
        currentMileage: v.mileage,
        mainImage,
      } : null,
      isPickupToday,
      isReturnToday,
      isOverdueReturn,
    };
  });

  return NextResponse.json({
    success: true,
    data: rentals,
  });
}
