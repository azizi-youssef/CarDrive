import { NextRequest, NextResponse } from 'next/server';
import { vehiclesService } from '@/lib/services/vehicles.service';
import { requireAgencyPermissionApi } from '@/lib/auth/access-api';
import type { SearchFilters } from '@/types';
import { isValidDateOnly } from '@/lib/utils/date-only';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    if (
      Boolean(startDate) !== Boolean(endDate) ||
      (startDate && !isValidDateOnly(startDate)) ||
      (endDate && !isValidDateOnly(endDate)) ||
      (startDate && endDate && startDate >= endDate)
    ) {
      return NextResponse.json(
        { success: false, error: 'La période de recherche est invalide.' },
        { status: 400 }
      );
    }

    const filters: SearchFilters = {
      category: searchParams.get('category') || undefined,
      brand: searchParams.get('brand') || undefined,
      transmission: (searchParams.get('transmission') as SearchFilters['transmission']) || undefined,
      fuel: (searchParams.get('fuel') as SearchFilters['fuel']) || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      agencyId: searchParams.get('agencyId') || undefined,
      query: searchParams.get('query') || undefined,
      startDate,
      endDate,
      sortBy: (searchParams.get('sortBy') as SearchFilters['sortBy']) || undefined,
    };

    const vehicles = await vehiclesService.getVehicles(filters);
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : vehicles.length;
    const paginated = vehicles.slice(offset, offset + limit);

    return NextResponse.json(
      {
        success: true,
        data: paginated,
        meta: { total: vehicles.length, limit, offset },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const agencyId = body.agency_id as string | undefined;
    if (!agencyId) {
      return NextResponse.json({ success: false, error: 'agency_id requis' }, { status: 400 });
    }

    const gate = await requireAgencyPermissionApi(agencyId, 'vehicles.manage');
    if (gate.denied) return gate.denied;

    const created = await vehiclesService.addVehicle(body);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Données invalides';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
