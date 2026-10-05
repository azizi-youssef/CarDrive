import { NextRequest, NextResponse } from 'next/server';
import { bookingsService } from '@/lib/services/bookings.service';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await context.params;
    const body = await req.json();
    const { action, notes, reason, alternativeVehicleId } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Action requise (approve, reject, propose_alternative)' }, { status: 400 });
    }

    if (action === 'approve') {
      const result = await bookingsService.approveBooking(reference, notes);
      return NextResponse.json(result);
    }

    if (action === 'reject') {
      const result = await bookingsService.rejectBooking(reference, reason);
      return NextResponse.json(result);
    }

    if (action === 'propose_alternative') {
      if (!alternativeVehicleId) {
        return NextResponse.json({ success: false, error: 'Identifiant du véhicule alternatif requis' }, { status: 400 });
      }
      const result = await bookingsService.proposeAlternative(reference, alternativeVehicleId, notes);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: `Action ${action} non reconnue` }, { status: 400 });
  } catch (error: any) {
    console.error('[API /api/bookings/[reference]/status] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
