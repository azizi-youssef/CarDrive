import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdminApi } from '@/lib/auth/admin-api';
import { agenciesService } from '@/lib/services/agencies.service';
import { vehiclesService } from '@/lib/services/vehicles.service';

export async function GET(req: NextRequest) {
  const onlyActive = req.nextUrl.searchParams.get('onlyActive') !== 'false';

  if (!onlyActive) {
    const denied = await requirePlatformAdminApi();
    if (denied) return denied;
  }

  try {
    const [agencies, vehicles] = await Promise.all([
      agenciesService.getAgencies(onlyActive),
      vehiclesService.getVehicles(),
    ]);
    const withCounts = agencies.map((agency) => ({
      ...agency,
      vehicle_count:
        agency.vehicle_count ??
        vehicles.filter((v) => v.agency_id === agency.id).length,
    }));

    return NextResponse.json({
      success: true,
      data: withCounts,
      meta: { total: withCounts.length },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
