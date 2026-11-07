import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_RETRY_POLICY, isRetryableStatus, maskPhone, retryDelayMs, withRetry, type AttemptOutcome } from './retry';

const noSleep = () => Promise.resolve();

describe('withRetry — envoi WhatsApp fiable', () => {
  it('réessaie après une erreur 5xx puis réussit', async () => {
    const outcomes: AttemptOutcome<string>[] = [
      { kind: 'response', status: 503, data: 'down' },
      { kind: 'response', status: 200, data: 'ok' },
    ];
    const attempt = vi.fn(async (n: number) => outcomes[n - 1]);
    const result = await withRetry(attempt, DEFAULT_RETRY_POLICY, noSleep);
    expect(result.attempts).toBe(2);
    expect(result.outcome).toEqual({ kind: 'response', status: 200, data: 'ok' });
  });

  it('respecte le nombre maximal de tentatives', async () => {
    const attempt = vi.fn(async () => ({ kind: 'response', status: 429, data: null }) as AttemptOutcome<null>);
    const result = await withRetry(attempt, { ...DEFAULT_RETRY_POLICY, maxAttempts: 3 }, noSleep);
    expect(attempt).toHaveBeenCalledTimes(3);
    expect(result.attempts).toBe(3);
  });

  it('ne réessaie pas une erreur définitive (4xx)', async () => {
    const attempt = vi.fn(async () => ({ kind: 'response', status: 400, data: 'bad' }) as AttemptOutcome<string>);
    const result = await withRetry(attempt, DEFAULT_RETRY_POLICY, noSleep);
    expect(attempt).toHaveBeenCalledTimes(1);
    expect(result.attempts).toBe(1);
  });

  it('ne réessaie jamais après un délai dépassé (le message a pu partir : pas de doublon)', async () => {
    const attempt = vi.fn(async () => ({ kind: 'timeout', error: new Error('TimeoutError') }) as AttemptOutcome<never>);
    const result = await withRetry(attempt, DEFAULT_RETRY_POLICY, noSleep);
    expect(attempt).toHaveBeenCalledTimes(1);
    expect(result.outcome.kind).toBe('timeout');
  });

  it('réessaie une erreur réseau survenue avant toute réponse', async () => {
    const outcomes: AttemptOutcome<string>[] = [
      { kind: 'network-error', error: new Error('ECONNRESET') },
      { kind: 'response', status: 200, data: 'ok' },
    ];
    const result = await withRetry(async (n) => outcomes[n - 1], DEFAULT_RETRY_POLICY, noSleep);
    expect(result.attempts).toBe(2);
  });

  it('attente exponentielle plafonnée, Retry-After respecté', () => {
    expect(retryDelayMs(1, DEFAULT_RETRY_POLICY)).toBe(500);
    expect(retryDelayMs(2, DEFAULT_RETRY_POLICY)).toBe(1500);
    expect(retryDelayMs(5, DEFAULT_RETRY_POLICY)).toBe(DEFAULT_RETRY_POLICY.maxDelayMs);
    expect(retryDelayMs(1, DEFAULT_RETRY_POLICY, 2)).toBe(2000);
    expect(retryDelayMs(1, DEFAULT_RETRY_POLICY, 3600)).toBe(DEFAULT_RETRY_POLICY.maxDelayMs);
  });

  it('statuts réessayables', () => {
    expect([429, 500, 502, 503].every(isRetryableStatus)).toBe(true);
    expect([200, 400, 401, 404].some(isRetryableStatus)).toBe(false);
  });
});

describe('maskPhone — journaux sans numéro complet', () => {
  it('masque le milieu du numéro', () => {
    expect(maskPhone('212612345678')).toBe('2126••••••78');
    expect(maskPhone('+212 6 12 34 56 78')).not.toContain('345');
    expect(maskPhone('')).toBe('');
  });
});
