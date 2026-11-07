import { NextRequest, NextResponse } from 'next/server';
import { serverError } from '@/lib/api/server-error';
import { vehiclesService } from '@/lib/services/vehicles.service';
import { requireAgencyPermissionApi } from '@/lib/auth/access-api';
import { toPublicVehicle } from '@/lib/vehicles/public';

type Ctx = { params: Promise<{ ref: string }> };

export async function GET(_req: NextRequest, context: Ctx) {
  try {
    const { ref } = await context.params;
    let vehicle = await vehiclesService.getVehicleBySlug(ref);
    if (!vehicle) {
      vehicle = await vehiclesService.getVehicleById(ref);
    }
    if (!vehicle) {
      return NextResponse.json({ success: false, error: 'Véhicule introuvable' }, { status: 404 });
    }
    const agency = vehicle.agency;
    const vehicleArchived = 'archived_at' in vehicle && vehicle.archived_at != null;
    const agencyArchived = Boolean(
      agency && 'archived_at' in agency && agency.archived_at != null
    );
    if (!vehicle.published || vehicleArchived || agency?.status !== 'ACTIVE' || agencyArchived) {
      return NextResponse.json({ success: false, error: 'Véhicule introuvable' }, { status: 404 });
    }
    return NextResponse.json(
      { success: true, data: toPublicVehicle(vehicle) },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: unknown) {
    return serverError(error, '/api/vehicles/[ref]');
  }
}

export async function PATCH(req: NextRequest, context: Ctx) {
  try {
    const { ref } = await context.params;
    const existing = await vehiclesService.getVehicleById(ref);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Véhicule introuvable' }, { status: 404 });
    }

    const gate = await requireAgencyPermissionApi(existing.agency_id, 'vehicles.manage');
    if (gate.denied) return gate.denied;

    const body = await req.json();
    const updated = await vehiclesService.updateVehicle(ref, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Mise à jour impossible' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    return serverError(error, '/api/vehicles/[ref]');
  }
}

export async function DELETE(_req: NextRequest, context: Ctx) {
  try {
    const { ref } = await context.params;
    const existing = await vehiclesService.getVehicleById(ref);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Véhicule introuvable' }, { status: 404 });
    }

    const gate = await requireAgencyPermissionApi(existing.agency_id, 'vehicles.manage');
    if (gate.denied) return gate.denied;

    const ok = await vehiclesService.deleteVehicle(ref);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Suppression impossible' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Véhicule supprimé' });
  } catch (error: unknown) {
    return serverError(error, '/api/vehicles/[ref]');
  }
}
