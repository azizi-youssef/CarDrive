import { NextRequest, NextResponse } from 'next/server';
import { bookingsService } from '@/lib/services/bookings.service';
import { authorizeBookingRead, redactBookingCustomerData } from '@/lib/auth/booking-access';
import { getServerAuth } from '@/lib/auth/server';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await context.params;
    if (!reference) {
      return NextResponse.json({ success: false, error: 'Référence requise' }, { status: 400 });
    }

    const auth = await getServerAuth();
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Authentification requise' }, { status: 401 });
    }

    const booking = await bookingsService.getBookingByReference(reference);
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Réservation introuvable' }, { status: 404 });
    }

    const access = await authorizeBookingRead(auth, booking);
    if (!access.allowed) {
      return NextResponse.json({ success: false, error: 'Réservation introuvable' }, { status: 404 });
    }

    const visibleBooking = access.canReadCustomerData
      ? await bookingsService.getBookingByReference(reference, true)
      : redactBookingCustomerData(booking);

    if (!visibleBooking) {
      return NextResponse.json({ success: false, error: 'Réservation introuvable' }, { status: 404 });
    }

    const events = await bookingsService.getBookingEvents(booking.id, access.canReadCustomerData);
    const visibleEvents = access.canReadCustomerData
      ? events
      : events.map((event) => ({ ...event, metadata: undefined, actor_id: undefined }));

    return NextResponse.json({
      success: true,
      booking: { ...visibleBooking, events: visibleEvents },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    console.error('[API /api/bookings/[reference]] Error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
