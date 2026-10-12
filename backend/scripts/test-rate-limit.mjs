import 'dotenv/config';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Définissez NEXT_PUBLIC_SUPABASE_URL (ou SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY pour exécuter le test d’intégration.'
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

function newKeyHash() {
  return createHash('sha256').update(randomUUID()).digest('hex');
}

async function consume(keyHash, limit, windowSeconds) {
  const { data, error } = await supabase.rpc('consume_api_rate_limit', {
    p_key_hash: keyHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  const result = Array.isArray(data) ? data[0] : data;
  assert.equal(typeof result?.allowed, 'boolean');
  assert.ok(Number(result.retry_after_sec) > 0);
  return result;
}

const sequentialKey = newKeyHash();
assert.equal((await consume(sequentialKey, 2, 60)).allowed, true);
assert.equal((await consume(sequentialKey, 2, 60)).allowed, true);
assert.equal((await consume(sequentialKey, 2, 60)).allowed, false);

const concurrentKey = newKeyHash();
const concurrentResults = await Promise.all(
  Array.from({ length: 20 }, () => consume(concurrentKey, 5, 60))
);
assert.equal(
  concurrentResults.filter((result) => result.allowed).length,
  5,
  'Concurrent calls must atomically allow exactly the configured limit.'
);

const expiringKey = newKeyHash();
assert.equal((await consume(expiringKey, 1, 1)).allowed, true);
await new Promise((resolve) => setTimeout(resolve, 1100));
assert.equal((await consume(expiringKey, 1, 1)).allowed, true);

const { error: invalidRequestError } = await supabase.rpc('consume_api_rate_limit', {
  p_key_hash: 'invalid',
  p_limit: 1,
  p_window_seconds: 60,
});
assert.ok(invalidRequestError, 'Invalid RPC arguments must produce a database error.');

console.log('Rate limit integration checks passed (sequential, concurrent, expiry, invalid RPC).');
