/**
 * Chargement des secrets pour les scripts d'administration.
 * Les clés ne doivent JAMAIS être écrites dans le code : elles sont lues
 * depuis l'environnement ou depuis `.env.local` (ignoré par git).
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local'), quiet: true });

export function requireEnv(...names) {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(`❌ Variables manquantes : ${missing.join(', ')} (définissez-les dans .env.local)`);
    process.exit(1);
  }
  return names.map((name) => process.env[name]);
}

export function getSupabaseAdminEnv() {
  const [url, serviceRoleKey] = requireEnv('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY');
  const projectRef = new URL(url).hostname.split('.')[0];
  return { url, serviceRoleKey, projectRef };
}
