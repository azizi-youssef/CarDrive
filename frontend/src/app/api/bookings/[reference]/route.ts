import { NextRequest, NextResponse } from 'next/server';
import { bookingsService } from '@/lib/services/bookings.service';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await context.params;
    if (!reference) {
      return NextResponse.json({ success: false, error: 'Référence requise' }, { status: 400 });
    }

    const booking = await bookingsService.getBookingByReference(reference);
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Réservation introuvable' }, { status: 404 });
    }

    // Récupérer les événements timeline
    const events = await bookingsService.getBookingEvents(booking.id);

    return NextResponse.json({
      success: true,
      booking: {
        ...booking,
        events,
      },
    });
  } catch (error: any) {
    console.error('[API /api/bookings/[reference]] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
