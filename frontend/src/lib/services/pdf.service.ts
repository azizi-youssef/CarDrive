import { jsPDF } from 'jspdf';
import { Booking } from '@/types';

export class PdfService {
  /**
   * Génère un document PDF officiel "CarDrive — Demande de réservation" (Format A4)
   * Retourne un ArrayBuffer / Buffer exploitable côté serveur pour téléchargement ou stockage.
   */
  generateBookingRequestPdf(booking: Booking): Uint8Array {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;

    // --- COULEURS DU THÈME CARDRIVE ---
    const primaryNavy = [2, 48, 107]; // #02306B
    const accentOrange = [255, 115, 0]; // #FF7300
    const darkSlate = [15, 23, 42]; // #0F172A
    const mutedSlate = [100, 116, 139]; // #64748B
    const bgLight = [248, 250, 252]; // #F8FAFC
    const borderGray = [226, 232, 240]; // #E2E8F0

    let currentY = 16;

    // --- HEADER / EN-TÊTE ---
    // Bandeau supérieur coloré
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.roundedRect(margin, currentY, contentWidth, 24, 3, 3, 'F');

    // Logo / Titre
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('CarDrive', margin + 8, currentY + 11);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Smart Car Rental Marketplace • Nador & Oriental', margin + 8, currentY + 18);

    // Bloc Référence & Date à droite
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(booking.reference || booking.booking_ref || 'CD-2026-DEMANDE', pageWidth - margin - 8, currentY + 11, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const dateStr = booking.requested_at
      ? new Date(booking.requested_at).toLocaleDateString('fr-FR')
      : new Date().toLocaleDateString('fr-FR');
    doc.text(`Demande émise le : ${dateStr}`, pageWidth - margin - 8, currentY + 18, { align: 'right' });

    currentY += 30;

    // --- BANNIÈRE DU TITRE DE DOCUMENT ---
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(margin, currentY, contentWidth, 12, 2, 2, 'FD');

    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('DEMANDE DE RÉSERVATION DE VÉHICULE', margin + 6, currentY + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(accentOrange[0], accentOrange[1], accentOrange[2]);
    const statusText = `STATUT : ${(booking.status || 'DEMANDE EN COURS').toUpperCase()}`;
    doc.text(statusText, pageWidth - margin - 6, currentY + 8, { align: 'right' });

    currentY += 18;

    // --- HELPER: SECTION TITLE ---
    const drawSectionTitle = (title: string, y: number) => {
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
      doc.text(title.toUpperCase(), margin + 4, y + 5);
      return y + 10;
    };

    // --- SECTION 1 : CLIENT & CONDUCTEUR ---
    currentY = drawSectionTitle('1. Informations Client & Conducteur', currentY);

    doc.setFontSize(8);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);

    const colW = (contentWidth - 6) / 2;
    const clientX1 = margin + 3;
    const clientX2 = margin + colW + 6;

    // Ligne 1
    doc.setFont('helvetica', 'bold');
    doc.text('Nom complet :', clientX1, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(booking.customer_name || `${booking.first_name || ''} ${booking.last_name || ''}`.trim() || 'Non spécifié', clientX1 + 28, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Téléphone / WhatsApp :', clientX2, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(booking.customer_phone || '—', clientX2 + 38, currentY);

    currentY += 6;

    // Ligne 2 (CIN & Pays)
    doc.setFont('helvetica', 'bold');
    doc.text('CIN / Passeport :', clientX1, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(booking.cin || 'Présentation sur place', clientX1 + 28, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Pays de résidence :', clientX2, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(booking.customer_country || 'Maroc', clientX2 + 38, currentY);

    currentY += 6;

    // Ligne 3 (Permis)
    doc.setFont('helvetica', 'bold');
    doc.text('N° Permis de conduire :', clientX1, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(booking.license_number || 'Présentation à la remise', clientX1 + 38, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Expiration permis :', clientX2, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(booking.license_expiry || '—', clientX2 + 38, currentY);

    if (booking.customer_email && !booking.customer_email.includes('@cardrive.ma')) {
      currentY += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Email contact :', clientX1, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(booking.customer_email, clientX1 + 28, currentY);
    }

    currentY += 10;

    // --- SECTION 2 : VÉHICULE DEMANDÉ ---
    currentY = drawSectionTitle('2. Véhicule & Agence Partenaire', currentY);

    const vehicleTitle = booking.vehicle
      ? `${booking.vehicle.brand} ${booking.vehicle.model} (${booking.vehicle.year})`
      : 'Véhicule sélectionné';
    const agencyName = booking.agency?.name || 'Agence locale partenaire';

    doc.setFont('helvetica', 'bold');
    doc.text('Véhicule :', clientX1, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(vehicleTitle, clientX1 + 28, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Agence gestionnaire :', clientX2, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(agencyName, clientX2 + 38, currentY);

    currentY += 6;

    doc.setFont('helvetica', 'bold');
    doc.text('Transmission :', clientX1, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(booking.vehicle?.transmission === 'AUTOMATIC' ? 'Automatique' : 'Manuelle', clientX1 + 28, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Carburant :', clientX2, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(booking.vehicle?.fuel || 'Diesel / Essence', clientX2 + 38, currentY);

    currentY += 6;

    doc.setFont('helvetica', 'bold');
    doc.text('Catégorie :', clientX1, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(booking.vehicle?.category || 'Berline / SUV', clientX1 + 28, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Caution requise :', clientX2, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${booking.deposit_amount || booking.vehicle?.deposit || 3000} DH (à l'agence)`, clientX2 + 38, currentY);

    currentY += 10;

    // --- SECTION 3 : DÉROULEMENT DE LA LOCATION ---
    currentY = drawSectionTitle('3. Dates & Modalités de Récupération', currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Prise en charge :', clientX1, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${booking.start_date} à ${booking.pickup_time || '10:00'}`, clientX1 + 30, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Lieu de prise :', clientX2, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(booking.pickup_location || 'Aéroport Nador', clientX2 + 30, currentY);

    currentY += 6;

    doc.setFont('helvetica', 'bold');
    doc.text('Restitution :', clientX1, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${booking.end_date} à ${booking.dropoff_time || '10:00'}`, clientX1 + 30, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Lieu de retour :', clientX2, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(booking.dropoff_location || 'Aéroport Nador', clientX2 + 30, currentY);

    currentY += 6;

    doc.setFont('helvetica', 'bold');
    doc.text('Durée totale :', clientX1, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${booking.total_days} jour(s)`, clientX1 + 30, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Mode de livraison :', clientX2, currentY);
    doc.setFont('helvetica', 'normal');
    const delivLabels: Record<string, string> = {
      AIRPORT: 'Livraison Aéroport Nador-Al Aroui',
      HOTEL: 'Livraison Hôtel',
      ADDRESS: 'Livraison à une adresse',
      AGENCY_PICKUP: 'Récupération en agence',
    };
    doc.text(delivLabels[booking.delivery_type || 'AIRPORT'] || 'Standard', clientX2 + 30, currentY);

    if (booking.flight_number) {
      currentY += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Vol arrivée :', clientX1, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(`${booking.flight_number} (Atterrissage : ${booking.flight_arrival_time || '—'})`, clientX1 + 30, currentY);
    }

    currentY += 10;

    // --- SECTION 4 : TARIFICATION & COMMISSION ---
    currentY = drawSectionTitle('4. Tarification & Ventilation Financière', currentY);

    // Tableau de tarification
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'FD');

    const subtotal = booking.subtotal || booking.total_price;
    const rate = booking.commission_rate || 15.00;
    const comm = booking.commission_amount || Math.round((subtotal * rate) / 100);
    const agencyAmount = booking.agency_amount || (subtotal - comm);

    doc.setFont('helvetica', 'normal');
    doc.text(`Tarif journalier : ${booking.daily_price} DH/jour`, margin + 6, currentY + 6);
    doc.text(`Durée de location : ${booking.total_days} jour(s)`, margin + 6, currentY + 12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Sous-total brut : ${subtotal} DH`, margin + 6, currentY + 19);

    doc.setFont('helvetica', 'normal');
    doc.text(`Commission CarDrive (${rate}%) : ${comm} DH`, margin + colW, currentY + 6);
    doc.text(`Montant agence (hors caution) : ${agencyAmount} DH`, margin + colW, currentY + 12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(`TOTAL LOCATION : ${booking.total_price} DH`, margin + colW, currentY + 19);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);

    currentY += 32;

    // --- SECTION 5 : NOTES DU CLIENT ---
    if (booking.customer_notes || booking.notes) {
      currentY = drawSectionTitle('5. Notes et demandes spéciales du client', currentY);
      doc.setFont('helvetica', 'italic');
      doc.text(`"${booking.customer_notes || booking.notes}"`, margin + 4, currentY);
      currentY += 8;
    }

    // --- SECTION 6 : CADRE DE VALIDATION DE L'AGENCE PARTENAIRE ---
    currentY = drawSectionTitle("6. Cadre réservé à l'agence de location partenaire", currentY);

    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, currentY, contentWidth, 38, 2, 2, 'D');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('[  ] Demande acceptée         [  ] Demande refusée         [  ] Alternative proposée', margin + 6, currentY + 7);

    doc.line(margin + 6, currentY + 11, pageWidth - margin - 6, currentY + 11);

    doc.text('Commentaires / Véhicule alternatif :', margin + 6, currentY + 17);
    doc.text('Nom du responsable agence : _______________________', margin + 6, currentY + 25);
    doc.text('Date : _____ / _____ / 2026', margin + 6, currentY + 32);

    doc.text('Signature & Cachet agence :', pageWidth - margin - 55, currentY + 17);
    doc.rect(pageWidth - margin - 55, currentY + 20, 48, 14, 'D');

    currentY += 44;

    // --- MENTION LÉGALE & FOOTER ---
    doc.setFontSize(7);
    doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(
      "IMPORTANT : CarDrive est l'intermédiaire technologique de mise en relation. Ce document constitue une demande de",
      pageWidth / 2,
      pageHeight - 14,
      { align: 'center' }
    );
    doc.setFont('helvetica', 'normal');
    doc.text(
      "réservation et ne remplace pas le contrat officiel de location signé directement avec l'agence partenaire lors de la prise en charge.",
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      `Document généré le ${new Date().toISOString()} • CarDrive Marketplace • www.cardrive.ma`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );

    return doc.output('arraybuffer') as unknown as Uint8Array;
  }
}

export const pdfService = new PdfService();
