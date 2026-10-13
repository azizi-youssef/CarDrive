import { NextRequest, NextResponse } from 'next/server';
import { vehiclesService } from '@/lib/services/vehicles.service';
import { isValidDateOnly } from '@/lib/utils/date-only';

type Ctx = { params: Promise<{ ref: string }> };

export async function GET(req: NextRequest, context: Ctx) {
  try {
    const { ref } = await context.params;
    const startDate = req.nextUrl.searchParams.get('startDate');
    const endDate = req.nextUrl.searchParams.get('endDate');

    if (
      !startDate ||
      !endDate ||
      !isValidDateOnly(startDate) ||
      !isValidDateOnly(endDate) ||
      startDate >= endDate
    ) {
      return NextResponse.json(
        { success: false, error: 'La période de recherche est invalide.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const vehicle =
      (await vehiclesService.getVehicleBySlug(ref)) ??
      (await vehiclesService.getVehicleById(ref));
    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Véhicule introuvable.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const available = await vehiclesService.checkAvailability(vehicle.id, startDate, endDate);
    return NextResponse.json(
      { success: true, data: { available } },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: unknown) {
    console.error('[API /api/vehicles/[ref]/availability] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Impossible de vérifier la disponibilité du véhicule.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
