import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Liens PDF signés (HMAC-SHA256) pour les clients invités, qui n'ont pas de session.
 * Sans signature valide, la route PDF exige une session autorisée.
 */

const PDF_LINK_TTL_SECONDS = 30 * 24 * 60 * 60;

function linkSecret(): string | null {
  return process.env.BOOKING_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

function sign(reference: string, expiresAt: number, secret: string): string {
  return createHmac('sha256', secret)
    .update(`booking-pdf:${reference.trim().toUpperCase()}:${expiresAt}`)
    .digest('base64url');
}

/** Chemin relatif du PDF, signé si un secret serveur est disponible. */
export function signedBookingPdfPath(reference: string, now = Date.now()): string {
  const path = `/api/bookings/${encodeURIComponent(reference)}/pdf`;
  const secret = linkSecret();
  if (!secret) return path;
  const expiresAt = Math.floor(now / 1000) + PDF_LINK_TTL_SECONDS;
  return `${path}?exp=${expiresAt}&sig=${sign(reference, expiresAt, secret)}`;
}

export function verifyBookingPdfSignature(
  reference: string,
  exp: string | null,
  sig: string | null,
  now = Date.now()
): boolean {
  const secret = linkSecret();
  if (!secret || !exp || !sig || !/^\d+$/.test(exp)) return false;
  const expiresAt = Number(exp);
  if (expiresAt < Math.floor(now / 1000)) return false;

  const expected = Buffer.from(sign(reference, expiresAt, secret));
  const received = Buffer.from(sig);
  return expected.length === received.length && timingSafeEqual(expected, received);
}
