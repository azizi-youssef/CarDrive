import { NextRequest, NextResponse } from 'next/server';
import { vehiclesService } from '@/lib/services/vehicles.service';
import { isValidDateOnly } from '@/lib/utils/date-only';
import { AvailabilityValidationError, availabilityMessage, type AvailabilityStatus } from '@/lib/availability/status';

type Ctx = { params: Promise<{ ref: string }> };

const NO_STORE = { 'Cache-Control': 'no-store' };

function respond(status: AvailabilityStatus) {
  // UNKNOWN : service indisponible (503) — jamais présenté comme disponible
  if (status === 'UNKNOWN') {
    return NextResponse.json(
      { success: false, error: availabilityMessage(status), data: { status, available: false } },
      { status: 503, headers: { ...NO_STORE, 'Retry-After': '30' } }
    );
  }
  return NextResponse.json(
    { success: true, data: { status, available: status === 'AVAILABLE' } },
    { headers: NO_STORE }
  );
}

/**
 * Disponibilité d'un véhicule (slug ou identifiant) sur une période.
 * États : AVAILABLE, UNAVAILABLE, UNKNOWN (fail-closed : une vérification impossible n'est jamais un succès).
 */
export async function GET(req: NextRequest, context: Ctx) {
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
      { status: 400, headers: NO_STORE }
    );
  }

  try {
    const vehicle =
      (await vehiclesService.getVehicleBySlug(ref)) ??
      (await vehiclesService.getVehicleById(ref));
    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Véhicule introuvable.' },
        { status: 404, headers: NO_STORE }
      );
    }

    return respond(await vehiclesService.getAvailabilityStatus(vehicle.id, startDate, endDate));
  } catch (error: unknown) {
    if (error instanceof AvailabilityValidationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400, headers: NO_STORE });
    }
    console.error('[API /api/vehicles/[ref]/availability] Availability check failed:', error instanceof Error ? error.message : error);
    return respond('UNKNOWN');
  }
}
