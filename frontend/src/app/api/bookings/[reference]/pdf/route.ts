import { NextRequest, NextResponse } from 'next/server';
import { bookingsService } from '@/lib/services/bookings.service';
import { pdfService } from '@/lib/services/pdf.service';
import { authorizeBookingRead } from '@/lib/auth/booking-access';
import { getServerAuth } from '@/lib/auth/server';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await context.params;
    if (!reference) {
      return new NextResponse('Référence requise', { status: 400 });
    }

    const auth = await getServerAuth();
    if (!auth) {
      return new NextResponse('Authentification requise', { status: 401 });
    }

    let booking = await bookingsService.getBookingByReference(reference);
    if (!booking) {
      return new NextResponse('Demande de réservation introuvable', { status: 404 });
    }

    const access = await authorizeBookingRead(auth, booking);
    if (!access.allowed) {
      return new NextResponse('Demande de réservation introuvable', { status: 404 });
    }
    if (!access.canReadCustomerData) {
      return new NextResponse('Accès au dossier client refusé', { status: 403 });
    }

    booking = await bookingsService.getBookingByReference(reference, true);
    if (!booking) {
      return new NextResponse('Demande de réservation introuvable', { status: 404 });
    }

    const pdfBytes = pdfService.generateBookingRequestPdf(booking);

    const allowedRoles = ['CUSTOMER', 'AGENCY_OWNER', 'AGENCY_MANAGER', 'AGENCY_STAFF', 'SUPER_ADMIN'] as const;
    type AllowedRole = (typeof allowedRoles)[number];
    const actorRole: AllowedRole =
      allowedRoles.includes(auth.role as AllowedRole) ? (auth.role as AllowedRole) : 'SUPER_ADMIN';

    await bookingsService.logEvent(booking.id, 'PDF_GENERATED', actorRole, auth.userId, {
      reference: booking.reference || reference,
      downloaded_at: new Date().toISOString(),
    });

    const filename = `CarDrive_Demande_${booking.reference || reference}.pdf`;
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('[API /api/bookings/[reference]/pdf] Error:', error);
    return new NextResponse('Erreur lors de la génération du PDF.', { status: 500 });
  }
}
