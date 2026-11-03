/**
 * Validation des images téléversées : le format est déduit des octets du fichier (signature),
 * jamais du type MIME ou de l'extension envoyés par le navigateur, qui sont falsifiables.
 */

export type DetectedImage = { mimeType: 'image/jpeg' | 'image/png' | 'image/webp'; extension: 'jpg' | 'png' | 'webp' };

export function detectImageType(bytes: Uint8Array): DetectedImage | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mimeType: 'image/jpeg', extension: 'jpg' };
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mimeType: 'image/png', extension: 'png' };
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  ) {
    return { mimeType: 'image/webp', extension: 'webp' };
  }
  return null;
}

/** Vrai si le contenu est bien une image du type annoncé (JPEG, PNG ou WebP). */
export function hasValidImageSignature(declaredType: string, bytes: Uint8Array): boolean {
  const detected = detectImageType(bytes);
  return detected !== null && detected.mimeType === (declaredType === 'image/jpg' ? 'image/jpeg' : declaredType);
}
