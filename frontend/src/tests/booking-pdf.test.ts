import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { pdfService, formatPdfAmount, formatPdfDate, formatPdfTime, pdfSafeText } from '../lib/services/pdf.service';
import type { Booking } from '../types';

/** Texte affiché du PDF : contenu des flux décompressés (opérateurs Tj) */
function pdfText(bytes: Uint8Array): string {
  const raw = Buffer.from(bytes).toString('latin1');
  const chunks: string[] = [];
  const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;
  while ((match = streamRe.exec(raw))) {
    const data = Buffer.from(match[1], 'latin1');
    try {
      chunks.push(inflateSync(data).toString('latin1'));
    } catch {
      chunks.push(match[1]);
    }
  }
  return chunks
    .join('\n')
    .match(/\((?:\\.|[^\\)])*\)\s*Tj/g)
    ?.map((op) => op.replace(/\)\s*Tj$/, '').slice(1).replace(/\\(.)/g, '$1'))
    .join(' ') ?? '';
}

function pageCount(bytes: Uint8Array): number {
  return (Buffer.from(bytes).toString('latin1').match(/\/Type \/Page\b(?!s)/g) ?? []).length;
}

const base = {
  id: 'b1',
  reference: 'CD-2026-123456',
  vehicle_id: 'v1',
  agency_id: 'a1',
  customer_name: 'Samira El Amrani',
  customer_email: 'samira@example.com',
  customer_phone: '+212 6 12 34 56 78',
  start_date: '2026-11-10',
  end_date: '2026-11-14',
  pickup_time: '09:30:00',
  dropoff_time: '',
  pickup_location: 'Aéroport Nador Al-Aroui',
  dropoff_location: 'Agence Nador centre',
  total_days: 4,
  daily_price: 350,
  total_price: 1400,
  commission_rate: 15,
  commission_amount: 210,
  agency_amount: 1190,
  deposit_amount: 0,
  status: 'REQUESTED',
  created_at: '2026-11-05T10:00:00Z',
  vehicle: { brand: 'Dacia', model: 'Logan', year: 2025, fuel: 'diesel', transmission: 'MANUAL', category: 'Économique' },
  agency: { name: 'Marchica Car', phone: '+212 5 36 00 00 00', email: '', address: 'Bd Mohammed V', city: 'Nador' },
} as unknown as Booking;

test('Formatage : dates, heures, montants et typographie', () => {
  assert.equal(formatPdfDate('2026-11-10'), '10/11/2026');
  assert.equal(formatPdfDate(''), '');
  assert.equal(formatPdfTime('09:30:00'), '09:30');
  assert.equal(formatPdfTime('n/a'), '');
  assert.equal(formatPdfAmount(12500), '12 500 DH');
  assert.equal(formatPdfAmount('abc'), '');
  assert.equal(pdfSafeText('l’agence — « ok » “oui”…'), `l'agence - « ok » "oui"...`);
});

test('PDF : statut traduit, jamais présenté comme confirmé, aucune valeur inventée', () => {
  const bytes = pdfService.generateBookingRequestPdf(base);
  assert.equal(Buffer.from(bytes).toString('latin1', 0, 5), '%PDF-');
  const text = pdfText(bytes);
  assert.ok(text.includes('CD-2026-123456'));
  assert.ok(!text.includes('REQUESTED'), 'le code brut du statut ne doit pas apparaître');
  assert.ok(!/confirmée par l'agence/i.test(text), 'une demande ne doit pas être présentée comme confirmée');
  assert.ok(text.includes('10/11/2026 à 09:30'));
  assert.ok(text.includes("heure à convenir avec l'agence"), "heure absente : pas d'heure inventée");
  assert.ok(text.includes("Communiquée par l'agence"), 'caution absente : pas de montant inventé');
  assert.ok(!text.includes('3000') && !text.includes('3 000'));
  assert.ok(text.includes('1 400 DH'));
  assert.ok(!text.includes('210') && !/commission/i.test(text), 'aucune donnée de commission');
});

test('PDF : réservation confirmée, sur une seule page', () => {
  const bytes = pdfService.generateBookingRequestPdf({ ...base, status: 'APPROVED', deposit_amount: 5000 } as Booking);
  const confirmed = pdfText(bytes);
  assert.equal(pageCount(bytes), 1);
  assert.ok(confirmed.includes("confirmée par l'agence"));
  assert.ok(confirmed.includes('5 000 DH'));
  assert.ok(confirmed.includes('Page 1 / 1'));
});

test('PDF : dossier complet et message court tiennent sur une page sans rien abréger', () => {
  const full = {
    ...base,
    customer_country: 'Belgique',
    license_number: 'B-778812',
    license_expiry: '2031-04-30',
    delivery_type: 'AIRPORT',
    flight_number: 'AT 1402',
    flight_arrival_time: '08:45',
    child_seat: true,
    additional_driver: true,
    pickup_location: 'Aéroport Nador Al-Aroui (NDR) — hall des arrivées, comptoir partenaires',
    customer_notes: 'Arrivée avec deux enfants, merci de prévoir le siège enfant installé. '.repeat(4),
  } as unknown as Booking;
  const bytes = pdfService.generateBookingRequestPdf(full);
  const text = pdfText(bytes);
  assert.equal(pageCount(bytes), 1);
  assert.ok(!text.includes('[...]') && !text.includes('Message abrégé'));
  assert.ok(text.includes('AT 1402') && text.includes('Conducteur additionnel'));
});

test('PDF : message client très long abrégé avec mention, toujours sur une page', () => {
  const longNotes = 'Merci de prévoir un siège enfant et une arrivée tardive. '.repeat(80);
  const bytes = pdfService.generateBookingRequestPdf({ ...base, customer_notes: longNotes } as Booking);
  const text = pdfText(bytes);
  assert.equal(pageCount(bytes), 1);
  assert.ok(text.includes('[...]'));
  assert.ok(text.includes('Message abrégé'));
  assert.ok(text.includes('Page 1 / 1'));
});
