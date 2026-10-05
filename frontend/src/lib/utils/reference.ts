/**
 * CarDrive Unique Booking Reference Generator
 * Format: CD-YYYY-XXXXXX (e.g. CD-2026-001842)
 * Easily readable, memorable, clean for WhatsApp and PDF invoices.
 */

export function generateBookingReference(year?: number): string {
  const currentYear = year || new Date().getFullYear();
  // Génère un numéro séquentiel/aléatoire sur 6 chiffres (000001 - 999999)
  const randomNum = Math.floor(1000 + Math.random() * 998999);
  const padded = String(randomNum).padStart(6, '0');
  return `CD-${currentYear}-${padded}`;
}

export function isValidBookingReference(ref: string): boolean {
  if (!ref) return false;
  // CD-2026-XXXXXX ou ancien format #NRD-XXXX
  return /^CD-\d{4}-\d{6}$/i.test(ref.trim()) || /^#?NRD-\d{4,6}$/i.test(ref.trim());
}
