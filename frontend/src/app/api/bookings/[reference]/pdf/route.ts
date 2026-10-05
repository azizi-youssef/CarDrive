import { NextRequest, NextResponse } from 'next/server';
import { bookingsService } from '@/lib/services/bookings.service';
import { pdfService } from '@/lib/services/pdf.service';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await context.params;
    if (!reference) {
      return new NextResponse('Référence requise', { status: 400 });
    }

    const booking = await bookingsService.getBookingByReference(reference);
    if (!booking) {
      return new NextResponse('Demande de réservation introuvable', { status: 404 });
    }

    // Génération serveur du document PDF A4
    const pdfBytes = pdfService.generateBookingRequestPdf(booking);

    // Journaliser l'événement de consultation/téléchargement du PDF
    await bookingsService.logEvent(booking.id, 'PDF_GENERATED', 'SYSTEM', undefined, {
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
  } catch (error: any) {
    console.error('[API /api/bookings/[reference]/pdf] Error:', error);
    return new NextResponse(`Erreur lors de la génération du PDF: ${error.message}`, { status: 500 });
  }
}
