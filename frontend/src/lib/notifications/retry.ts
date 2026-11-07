/**
 * Envoi fiable des notifications sortantes (WhatsApp Cloud API) : nouvelles tentatives contrôlées.
 *
 * Règles :
 * - on ne réessaie que lorsque l'envoi n'a certainement PAS été accepté : 429, 5xx, erreur réseau
 *   survenue avant toute réponse ;
 * - un délai dépassé (timeout) est ambigu (le message a pu partir) : pas de nouvelle tentative,
 *   pour ne jamais envoyer deux fois le même message (idempotence côté destinataire) ;
 * - nombre de tentatives borné, attente exponentielle, en-tête Retry-After respecté (plafonné) ;
 * - chaque résultat indique le nombre de tentatives, pour le suivi des échecs.
 */

export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = { maxAttempts: 3, baseDelayMs: 500, maxDelayMs: 4000 };

export type AttemptOutcome<T> =
  | { kind: 'response'; status: number; data: T; retryAfterSeconds?: number | null }
  | { kind: 'network-error'; error: Error }
  | { kind: 'timeout'; error: Error };

export interface RetryResult<T> {
  outcome: AttemptOutcome<T>;
  attempts: number;
}

export function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}

function shouldRetry<T>(outcome: AttemptOutcome<T>): boolean {
  if (outcome.kind === 'network-error') return true;
  if (outcome.kind === 'timeout') return false;
  return isRetryableStatus(outcome.status);
}

export function retryDelayMs(attempt: number, policy: RetryPolicy, retryAfterSeconds?: number | null): number {
  if (retryAfterSeconds && Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return Math.min(retryAfterSeconds * 1000, policy.maxDelayMs);
  }
  return Math.min(policy.baseDelayMs * 3 ** (attempt - 1), policy.maxDelayMs);
}

/** Exécute `attempt` jusqu'à succès, erreur définitive ou épuisement des tentatives. */
export async function withRetry<T>(
  attempt: (attemptNumber: number) => Promise<AttemptOutcome<T>>,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
): Promise<RetryResult<T>> {
  let last: AttemptOutcome<T> | null = null;
  for (let attemptNumber = 1; attemptNumber <= policy.maxAttempts; attemptNumber += 1) {
    last = await attempt(attemptNumber);
    if (!shouldRetry(last) || attemptNumber === policy.maxAttempts) {
      return { outcome: last, attempts: attemptNumber };
    }
    await sleep(retryDelayMs(attemptNumber, policy, last.kind === 'response' ? last.retryAfterSeconds : null));
  }
  // Inatteignable (maxAttempts >= 1), conservé pour le typage
  return { outcome: last as AttemptOutcome<T>, attempts: policy.maxAttempts };
}

/** Numéro masqué pour les journaux : « 2126•••••78 » (jamais le numéro complet) */
export function maskPhone(phone: string | null | undefined): string {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.length <= 4) return '•'.repeat(digits.length);
  return `${digits.slice(0, 4)}${'•'.repeat(Math.max(0, digits.length - 6))}${digits.slice(-2)}`;
}
