import { NextRequest, NextResponse } from 'next/server';
import { bookingsService } from '@/lib/services/bookings.service';
import { bookingRequestSchema } from '@/lib/validations/booking';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validation Zod stricte
    const validation = bookingRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues.map((i) => i.message).join(', '),
        },
        { status: 400 }
      );
    }

    // 2. Création de la demande via le service métier certifié
    const result = await bookingsService.createBookingRequest(validation.data);

    if (!result.success || !result.booking) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Erreur lors de la création de la demande',
        },
        { status: 400 }
      );
    }

    const appUrl = req.nextUrl.origin;
    const { notificationService } = await import('@/lib/services/notification.service');
    const agencyWhatsAppMessage = notificationService.formatAgencyWhatsAppMessage(result.booking, appUrl);
    const agencyPhone = result.booking.agency?.whatsapp || result.booking.agency?.phone || '+212661234567';
    const agencyWhatsAppUrl = notificationService.generateWhatsAppLink(agencyPhone, agencyWhatsAppMessage);
    const pdfUrl = `${appUrl}/api/bookings/${encodeURIComponent(result.booking.reference || '')}/pdf`;

    // Envoi de la notification au dashboard agence
    await notificationService.sendDashboardNotification({
      agencyId: result.booking.agency_id,
      title: `Nouvelle demande de réservation ${result.booking.reference}`,
      message: `${result.booking.customer_name} — ${result.booking.vehicle?.brand} ${result.booking.vehicle?.model} (${result.booking.total_days}j à ${result.booking.pickup_location})`,
      link: `/agency?booking=${encodeURIComponent(result.booking.reference || '')}`,
      type: 'BOOKING',
    });

    return NextResponse.json({
      success: true,
      booking: result.booking,
      reference: result.booking.reference,
      pdfUrl,
      agencyWhatsAppUrl,
      agencyWhatsAppMessage,
    });
  } catch (error: any) {
    console.error('[API /api/bookings POST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erreur interne du serveur',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agencyId = searchParams.get('agencyId') || undefined;
    const customerId = searchParams.get('customerId') || undefined;

    const bookings = await bookingsService.getBookings({ agencyId, customerId });
    return NextResponse.json({ success: true, bookings });
  } catch (error: any) {
    console.error('[API /api/bookings GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
