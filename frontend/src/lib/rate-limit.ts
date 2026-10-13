import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/server';

const hits = new Map<string, { count: number; resetAt: number }>();

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

export class RateLimitUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitUnavailableError';
  }
}

/** Local development fallback only. Production uses the shared database limiter below. */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  for (const [storedKey, entry] of hits) {
    if (now > entry.resetAt) hits.delete(storedKey);
  }
  if (hits.size >= 10_000 && !hits.has(key)) {
    const oldestKey = hits.keys().next().value;
    if (oldestKey) hits.delete(oldestKey);
  }
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (entry.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { ok: true };
}

export async function checkDistributedRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult | null> {
  const supabase = await createAdminClient();
  if (!supabase) return null;

  const keyHash = createHash('sha256').update(key).digest('hex');
  const { data, error } = await supabase.rpc('consume_api_rate_limit', {
    p_key_hash: keyHash,
    p_limit: limit,
    p_window_seconds: Math.ceil(windowMs / 1000),
  });
  if (error) {
    console.error('[RateLimit] Shared limiter failed:', error.message);
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[RateLimit] Falling back to local memory rate limiter in development.');
      return null;
    }
    if (error.code === 'PGRST202' || error.code === '42883') {
      throw new RateLimitUnavailableError(
        'Service de limitation indisponible. Appliquez la migration rate_limit_rpc et rechargez le cache du schéma Supabase.'
      );
    }
    throw new RateLimitUnavailableError(
      'Le service de limitation est indisponible. Vérifiez la migration Supabase et la connexion à la base de données.'
    );
  }
  const result = data?.[0];
  if (!result || typeof result.allowed !== 'boolean') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[RateLimit] Invalid result from DB rate limiter, falling back to local memory.');
      return null;
    }
    throw new RateLimitUnavailableError(
      'Réponse invalide du service de limitation des requêtes.'
    );
  }
  return result.allowed
    ? { ok: true }
    : { ok: false, retryAfterSec: Math.max(1, Number(result.retry_after_sec) || 1) };
}

export function clientIpFromRequest(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') ?? 'unknown';
}
