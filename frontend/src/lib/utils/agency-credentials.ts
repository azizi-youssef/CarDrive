/**
 * Utilitaires pour la génération et la normalisation des identifiants agences CarDrive.
 * Respecte les exigences strictes de normalisation, unicité et sécurité.
 */

const CARDRIVE_EMAIL_DOMAIN = 'cardrive.ma';

/**
 * Normalise un nom d'agence en composante email locale :
 * 1. Minuscules
 * 2. Suppression des accents (décomposition Unicode NFD)
 * 3. Remplacement des espaces et séparateurs par des points
 * 4. Suppression des caractères interdits et réduction des points consécutifs
 * 5. Suppression des points de début et de fin
 */
export function normalizeAgencyLocalPart(agencyName: string): string {
  if (!agencyName || typeof agencyName !== 'string') {
    return 'agence';
  }

  const cleaned = agencyName
    // 1 & 2. Minuscules et suppression des accents
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // 3. Remplacement des espaces, tirets, apostrophes, underscores et séparateurs par des points
    .replace(/[\s\-_'’/\\+&@#~.,:;!?()\[\]{}"]+/g, '.')
    // 4. Suppression des caractères non alphanumériques restants (sauf le point)
    .replace(/[^a-z0-9.]/g, '')
    // Suppression des points consécutifs
    .replace(/\.+/g, '.')
    // 5. Suppression des points de tête et de fin
    .replace(/^\.+|\.+$/g, '');

  return cleaned || 'agence';
}

/**
 * Génère l'adresse email de base au format `nom.agence@cardrive.ma`.
 */
export function generateBaseAgencyEmail(agencyName: string): string {
  const localPart = normalizeAgencyLocalPart(agencyName);
  return `${localPart}@${CARDRIVE_EMAIL_DOMAIN}`;
}

/**
 * Génère une liste de candidats d'adresses email avec suffixes numériques si collision.
 * Exemple : ['nom.agence@cardrive.ma', 'nom.agence2@cardrive.ma', 'nom.agence3@cardrive.ma', ...]
 */
export function generateCandidateAgencyEmails(agencyName: string, maxCandidates = 10): string[] {
  const localPart = normalizeAgencyLocalPart(agencyName);
  const candidates: string[] = [`${localPart}@${CARDRIVE_EMAIL_DOMAIN}`];

  for (let i = 2; i <= maxCandidates; i++) {
    candidates.push(`${localPart}${i}@${CARDRIVE_EMAIL_DOMAIN}`);
  }

  return candidates;
}

/**
 * Résout une adresse email unique en vérifiant l'existence via une fonction de callback.
 */
export async function resolveUniqueAgencyEmail(
  agencyName: string,
  isTaken: (email: string) => Promise<boolean>
): Promise<string> {
  const candidates = generateCandidateAgencyEmails(agencyName, 20);

  for (const candidate of candidates) {
    const exists = await isTaken(candidate);
    if (!exists) {
      return candidate;
    }
  }

  // Fallback si 20 collisions : timestamp suffix
  const localPart = normalizeAgencyLocalPart(agencyName);
  return `${localPart}.${Date.now().toString().slice(-4)}@${CARDRIVE_EMAIL_DOMAIN}`;
}

/**
 * Génère un mot de passe temporaire hautement sécurisé respectant les exigences de complexité :
 * - Minuscules, majuscules, chiffres, caractères spéciaux
 * - Longueur paramétrable (défaut 14)
 */
export function generateTemporaryPassword(length = 14): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*_-';

  // Assurer au moins un caractère de chaque groupe
  const chars = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  const allChars = upper + lower + digits + symbols;
  while (chars.length < length) {
    chars.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Mélange de Fisher-Yates
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

/**
 * Normalise un nom d'agence en slug d'URL valide (ex: "rif-car-nador").
 */
export function normalizeAgencySlug(agencyName: string): string {
  if (!agencyName || typeof agencyName !== 'string') return 'agence';

  const slug = agencyName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'agence';
}
