/**
 * Script de reconstruction complète de la base de données CarDrive.
 * Exécute les fichiers SQL dans l'ordre correct via l'API Supabase.
 * 
 * Usage: node scripts/rebuild-database.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SUPABASE_URL = 'https://wviqbscbnrrpxpojhqql.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2aXFic2NibnJycHhwb2pocXFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDkzMDY1MSwiZXhwIjoyMTA2NTA2NjUxfQ.U0SzFdOvWGL2y56F4ssfM9Ov5xkCWQj6tg56ru0ubQM';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Ordre d'exécution des fichiers SQL
const SQL_FILES = [
  { label: 'Schéma principal',            path: join(ROOT, 'backend/supabase/schema.sql') },
  { label: 'Booking system v2',           path: join(ROOT, 'backend/supabase/migrations/20261005_booking_system_v2.sql') },
  { label: 'API Rate Limits table',       path: join(ROOT, 'backend/supabase/migrations/20261011_api_rate_limits.sql') },
  { label: 'Rate Limit RPC (corrigé)',    path: join(ROOT, 'backend/supabase/migrations/20261011000100_rate_limit_rpc.sql') },
  { label: 'Booking Idempotency',         path: join(ROOT, 'backend/supabase/migrations/20261011000200_booking_idempotency.sql') },
  { label: 'Agency Access Control',       path: join(ROOT, 'backend/supabase/migrations/20261010_agency_access_control.sql') },
  { label: 'Security Remediation',        path: join(ROOT, 'backend/supabase/migrations/20261011_security_remediation.sql') },
  { label: 'Populate Images & Features',  path: join(ROOT, 'backend/supabase/migrations/20261010_populate_images_features.sql') },
  { label: 'Enable Supabase Realtime',    path: join(ROOT, 'backend/supabase/migrations/20261016_enable_supabase_realtime.sql') },
];

async function runSQL(label, sql) {
  process.stdout.write(`  → ${label}... `);
  
  // Supabase ne permet pas d'exécuter du DDL via rpc directement
  // On utilise l'API REST SQL Management (nécessite service_role en header)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_ddl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ sql }),
  }).catch(() => null);

  if (res && res.ok) {
    console.log('✅');
    return true;
  }

  // Fallback: afficher le SQL pour exécution manuelle
  console.log('⚠️  (manuel requis)');
  return false;
}

// Concaténer tous les SQL en un seul bloc
console.log('\n🚗 CarDrive — Reconstruction de la base de données\n');
console.log('='.repeat(60));
console.log('\n📋 INSTRUCTIONS :');
console.log('   1. Ouvrez le SQL Editor Supabase :');
console.log('      https://supabase.com/dashboard/project/wviqbscbnrrpxpojhqql/sql/new\n');
console.log('   2. Exécutez chaque bloc SQL ci-dessous dans l\'ordre\n');
console.log('='.repeat(60));

for (const { label, path } of SQL_FILES) {
  let sql;
  try {
    sql = readFileSync(path, 'utf-8');
  } catch (err) {
    console.warn(`\n⚠️  Fichier introuvable : ${path}`);
    continue;
  }

  console.log(`\n\n${'━'.repeat(60)}`);
  console.log(`-- 📄 ${label}`);
  console.log(`-- Fichier : ${path.replace(ROOT, '.')}`);
  console.log('━'.repeat(60));
  console.log(sql.trim());
}

console.log('\n\n' + '='.repeat(60));
console.log('✅ Tous les fichiers SQL ont été affichés.');
console.log('   Copiez chaque bloc dans le SQL Editor et exécutez-les dans l\'ordre.');
console.log('='.repeat(60));
