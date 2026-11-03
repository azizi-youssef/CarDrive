/**
 * Seules les images locales ou du stockage Supabase passent par l'optimiseur Next
 * (hôtes déclarés dans next.config `remotePatterns`). Les autres sont servies telles quelles.
 */
export function isOptimizableImage(src: string): boolean {
  if (src.startsWith('/')) return true;
  try {
    const { hostname } = new URL(src);
    return hostname.endsWith('.supabase.co') || hostname === 'images.unsplash.com';
  } catch {
    return false;
  }
}
