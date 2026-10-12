/**
 * Script d'application de la migration rate_limit_rpc corrigée.
 * Usage : node scripts/apply-rate-limit-migration.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Variables manquantes : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const SQL_PATH = join(
  __dirname,
  '../backend/supabase/migrations/20261011000100_rate_limit_rpc.sql'
);
const sql = readFileSync(SQL_PATH, 'utf-8');

console.log('🔄 Application de la migration rate_limit_rpc sur Supabase...');

const { error } = await supabase.rpc('exec_sql', { sql }).catch(() => ({ error: { message: 'exec_sql non disponible' } }));

if (error) {
  // exec_sql non disponible → utiliser l'API REST SQL directe
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
  console.log('ℹ️  Tentative via API REST...');

  const res = await fetch(`${SUPABASE_URL.replace('/rest/v1', '')}/pg`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('❌ Erreur API REST:', text);
    console.log('\n📋 Copiez et exécutez ce SQL manuellement dans le SQL Editor de Supabase :');
    console.log('   https://supabase.com/dashboard/project/wviqbscbnrrpxpojhqql/sql');
    console.log('\n' + SQL_PATH + '\n');
    process.exit(1);
  }

  const data = await res.json();
  console.log('✅ Migration appliquée via API REST:', data);
} else {
  console.log('✅ Migration appliquée avec succès.');
}

// Test de la fonction
console.log('\n🧪 Test de consume_api_rate_limit...');
const { data: testData, error: testError } = await supabase.rpc('consume_api_rate_limit', {
  p_key_hash: 'a'.repeat(64),
  p_limit: 10,
  p_window_seconds: 60,
});

if (testError) {
  console.error('❌ Test échoué:', testError.message);
} else {
  console.log('✅ Test réussi:', testData);
}
