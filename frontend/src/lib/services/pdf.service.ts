import { jsPDF } from 'jspdf';
import { Booking } from '@/types';
import { formatDateFr } from '@/lib/utils';

/**
 * Charge le logo officiel CarDrive depuis le système de fichiers (côté serveur).
 */
function loadLogoDataUrl(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    const candidatePaths = [
      path.join(process.cwd(), 'frontend', 'public', 'Logo-CarDrive2.png'),
      path.join(process.cwd(), 'public', 'Logo-CarDrive2.png'),
      path.join(process.cwd(), 'frontend', 'public', 'Logo_CarDrive1.png'),
      path.join(process.cwd(), 'public', 'Logo_CarDrive1.png'),
      path.join(process.cwd(), 'frontend', 'public', 'logo_CarDrive.jpeg'),
      path.join(process.cwd(), 'public', 'logo_CarDrive.jpeg'),
      path.join(process.cwd(), 'frontend', 'public', 'icon_CarDrive1.png'),
      path.join(process.cwd(), 'public', 'icon_CarDrive1.png'),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
        const ext = path.extname(p).toLowerCase().replace('.', '');
        const mime = ext === 'jpg' ? 'jpeg' : ext;
        const base64 = fs.readFileSync(/*turbopackIgnore: true*/ p).toString('base64');
        return `data:image/${mime};base64,${base64}`;
      }
    }
  } catch {
    // Environnement sans fs direct
  }
  return null;
}

export class PdfService {
  /**
   * Génère un document PDF officiel "CarDrive — Demande de réservation" (Format A4)
   * Retourne un ArrayBuffer / Buffer exploitable côté serveur pour téléchargement ou stockage.
   */
  generateBookingRequestPdf(booking: Booking, customLogoDataUrl?: string): Uint8Array {
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
    const headerHeight = 26;
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.roundedRect(margin, currentY, contentWidth, headerHeight, 3, 3, 'F');

    // Logo CarDrive
    const logoData = customLogoDataUrl || loadLogoDataUrl();
    let textStartX = margin + 8;

    if (logoData) {
      try {
        // Tuile blanche avec bordure discrète pour faire ressortir le logo officiel
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin + 4, currentY + 4, 52, 18, 2, 2, 'F');

        const format = logoData.includes('image/jpeg') || logoData.includes('image/jpg') ? 'JPEG' : 'PNG';
        doc.addImage(logoData, format, margin + 6, currentY + 5.5, 48, 15);

        textStartX = margin + 60;
      } catch (err) {
        console.warn('[PdfService] Error drawing logo, using text fallback:', err);
      }
    }

    if (!logoData || textStartX === margin + 8) {
      // Fallback textuel stylisé
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('CarDrive', margin + 8, currentY + 11);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Plateforme de Location Automobile • Nador & Région Oriental', margin + 8, currentY + 18);
    } else {
      // Titre / Slogan textuel à côté du logo officiel
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('CarDrive Marketplace', textStartX, currentY + 11);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text('Nador & Région de l’Oriental', textStartX, currentY + 17);
    }

    // Bloc Référence & Date à droite
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(booking.reference || booking.booking_ref || 'CD-2026-DEMANDE', pageWidth - margin - 6, currentY + 10, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    const dateStr = booking.requested_at
      ? formatDateFr(booking.requested_at)
      : formatDateFr(new Date());
    doc.text(`Demande émise le : ${dateStr}`, pageWidth - margin - 6, currentY + 16, { align: 'right' });
    doc.text('Fiche officielle de remise', pageWidth - margin - 6, currentY + 21, { align: 'right' });

    currentY += headerHeight + 6;

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
    const fuelLabels: Record<string, string> = {
      DIESEL: 'Diesel',
      GASOLINE: 'Essence / Sans-plomb',
      HYBRID: 'Hybride (Essence + Électrique)',
      ELECTRIC: 'Électrique (100%)',
      // Variantes minuscules ou mixtes possibles depuis la DB
      diesel: 'Diesel',
      gasoline: 'Essence / Sans-plomb',
      hybrid: 'Hybride (Essence + Électrique)',
      electric: 'Électrique (100%)',
      Diesel: 'Diesel',
      Gasoline: 'Essence / Sans-plomb',
      Hybrid: 'Hybride (Essence + Électrique)',
      Electric: 'Électrique (100%)',
    };
    // Normaliser la clé pour robustesse (majuscule)
    const fuelKey = (booking.vehicle?.fuel || '').trim().toUpperCase();
    const fuelLabel = fuelKey ? (fuelLabels[fuelKey] || fuelKey) : 'Non renseigné';
    doc.text(fuelLabel, clientX2 + 38, currentY);

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

    // Encadré Spécial : Point de rendez-vous choisi par le client
    currentY += 8;
    doc.setFillColor(240, 249, 255); // bg-blue-50
    doc.setDrawColor(186, 230, 253); // border-blue-200
    doc.roundedRect(margin, currentY, contentWidth, 13, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(2, 48, 107);
    doc.text('POINT DE RENDEZ-VOUS CHOISI :', margin + 4, currentY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(booking.pickup_location || 'Aéroport Nador Al-Aroui (NDR)', margin + 58, currentY + 5);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Présentez cette demande PDF officielle avec votre CIN/Passeport physique à l’agent d’accueil CarDrive.', margin + 4, currentY + 10);
    currentY += 17;

    // --- SECTION 4 : TARIFICATION DE LA LOCATION ---
    currentY = drawSectionTitle('4. Tarification de la Location', currentY);

    // Tableau de tarification (Aucune mention de commission ou marge plateforme)
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);

    doc.text(`Tarif journalier : ${booking.daily_price} DH / jour`, margin + 6, currentY + 7);
    doc.text(`Durée de location : ${booking.total_days} jour(s)`, margin + 6, currentY + 14);

    const depositAmount = booking.deposit_amount || booking.vehicle?.deposit || 3000;
    doc.text(`Caution remboursable : ${depositAmount} DH (à l'agence)`, margin + colW, currentY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(`MONTANT TOTAL LOCATION : ${booking.total_price} DH`, margin + 6, currentY + 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
    doc.text('Paiement : à la remise du véhicule auprès de l’agence partenaire', margin + colW, currentY + 20);

    currentY += 30;

    // --- SECTION 5 : NOTES DU CLIENT (si existantes) ---
    if (booking.customer_notes || booking.notes) {
      currentY = drawSectionTitle('5. Notes et demandes particulières du client', currentY);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text(`"${booking.customer_notes || booking.notes}"`, margin + 4, currentY);
      currentY += 10;
    }

    // --- SECTION 6 : CADRE DE CONTRÔLE ET REMISE DU VÉHICULE ---
    currentY = drawSectionTitle('Fiche de Contrôle & Remise du Véhicule (À compléter à la prise en charge)', currentY);

    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, currentY, contentWidth, 42, 2, 2, 'D');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);

    doc.text('Contrôle des documents :  [  ] CIN / Passeport vérifié       [  ] Permis de conduire vérifié & valide', margin + 6, currentY + 7);
    doc.line(margin + 6, currentY + 11, pageWidth - margin - 6, currentY + 11);

    doc.text('Kilométrage au départ : _________________ km', margin + 6, currentY + 18);

    // Afficher le type de carburant pré-rempli depuis la fiche véhicule
    const handoverFuelLabels: Record<string, string> = {
      DIESEL: 'Diesel',
      GASOLINE: 'Essence',
      HYBRID: 'Hybride',
      ELECTRIC: 'Électrique',
    };
    const hFuelKey = (booking.vehicle?.fuel || '').trim().toUpperCase();
    const hFuelType = hFuelKey ? (handoverFuelLabels[hFuelKey] || hFuelKey) : null;

    if (hFuelType) {
      // Type connu : afficher proprement avec le type pré-rempli
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
      doc.text(`Type carburant : ${hFuelType}`, margin + 6, currentY + 25);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text('  Niveau : [ ] 1/4  [ ] 1/2  [ ] 3/4  [X] Plein  (à cocher au départ)', margin + 6 + 44, currentY + 25);
    } else {
      // Type inconnu : cases à cocher sans pré-remplissage
      doc.text('Carburant & Niveau : _______________  [ ] 1/4  [ ] 1/2  [ ] 3/4  [ ] Plein', margin + 6, currentY + 25);
    }

    doc.text('Date & heure réelles : _____ / _____ / 2026 à _____ : _____', margin + 6, currentY + 32);

    // Cadre signatures
    doc.setFont('helvetica', 'bold');
    doc.text('Signature du Conducteur :', pageWidth - margin - 65, currentY + 17);
    doc.rect(pageWidth - margin - 65, currentY + 20, 28, 18, 'D');

    doc.text('Cachet & Agence :', pageWidth - margin - 32, currentY + 17);
    doc.rect(pageWidth - margin - 32, currentY + 20, 26, 18, 'D');

    currentY += 46;

    // --- MENTION LÉGALE & FOOTER ---
    doc.setFontSize(7);
    doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(
      "IMPORTANT : CarDrive est l'intermédiaire technologique de mise en relation. Ce document constitue le bon officiel de",
      pageWidth / 2,
      pageHeight - 14,
      { align: 'center' }
    );
    doc.setFont('helvetica', 'normal');
    doc.text(
      "réservation et de remise, facilitant la préparation et la signature du contrat de location officiel auprès de l'agence partenaire.",
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      `Document généré le ${formatDateFr(new Date())} • CarDrive Marketplace • www.cardrive.ma`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );

    return doc.output('arraybuffer') as unknown as Uint8Array;
  }
}

export const pdfService = new PdfService();
