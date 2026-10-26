/**
 * Script d'application de la migration d'abonnement par capacité.
 * Usage : node scripts/apply-subscription-migration.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wviqbscbnrrpxpojhqql.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2aXFic2NibnJycHhwb2pocXFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDkzMDY1MSwiZXhwIjoyMTA2NTA2NjUxfQ.U0SzFdOvWGL2y56F4ssfM9Ov5xkCWQj6tg56ru0ubQM';

const SQL_PATH = join(
  __dirname,
  '../backend/supabase/migrations/20261026000100_agency_subscription_monetization.sql'
);
const sql = readFileSync(SQL_PATH, 'utf-8');

console.log('🔄 Application de la migration Abonnement par Capacité sur Supabase...');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

let rpcErr = null;
try {
  const res = await supabase.rpc('exec_sql', { sql });
  rpcErr = res.error;
} catch (e) {
  rpcErr = e;
}

if (rpcErr) {
  // Tester si les tables sont déjà créées
  const { data: testTable, error: testErr } = await supabase.from('subscription_plans').select('id').limit(1);
  if (!testErr) {
    console.log('✅ La table subscription_plans est déjà présente et active sur Supabase !');
  } else {
    console.log('ℹ️  Les tables SQL doivent être exécutées dans le Dashboard Supabase.');
    console.log('📋 Rendez-vous sur votre SQL Editor Supabase :');
    console.log('   https://supabase.com/dashboard/project/wviqbscbnrrpxpojhqql/sql');
    console.log('   Et collez le contenu du fichier :');
    console.log('   ' + SQL_PATH);
  }
} else {
  console.log('✅ Migration appliquée avec succès via Supabase RPC !');
}
