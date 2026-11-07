import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { PGlite, type Transaction } from '@electric-sql/pglite';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

/**
 * Base PostgreSQL réelle (PGlite, PostgreSQL 18 en WebAssembly) reproduisant l'environnement Supabase :
 * rôles anon / authenticated / service_role, schéma auth (auth.uid() lu dans les claims JWT comme sur
 * Supabase), schéma storage, privilèges par défaut du schéma public, publication supabase_realtime.
 * Le schéma de base puis TOUTES les migrations du dépôt y sont appliqués dans l'ordre des fichiers.
 */

export const SUPABASE_DIR = path.resolve(__dirname, '../../../../backend/supabase');
export const MIGRATIONS_DIR = path.join(SUPABASE_DIR, 'migrations');

/** Fichiers de migration dans l'ordre d'application (tri des noms, comme la CLI Supabase) */
export function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();
}

const SUPABASE_BOOTSTRAP = `
CREATE ROLE anon NOLOGIN NOINHERIT;
CREATE ROLE authenticated NOLOGIN NOINHERIT;
CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
CREATE ROLE authenticator NOLOGIN NOINHERIT;
GRANT anon, authenticated, service_role TO authenticator;

CREATE SCHEMA auth;
CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  role TEXT DEFAULT 'authenticated',
  raw_user_meta_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_app_meta_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Définitions identiques à Supabase : l'identité vient des claims du JWT de la requête
CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.sub', true), ''),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;
CREATE FUNCTION auth.role() RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.role', true), ''),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;
CREATE FUNCTION auth.jwt() RETURNS JSONB LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated, service_role;

CREATE SCHEMA storage;
CREATE TABLE storage.buckets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  public BOOLEAN DEFAULT false,
  file_size_limit BIGINT,
  allowed_mime_types TEXT[],
  owner UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE storage.objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id TEXT REFERENCES storage.buckets(id),
  name TEXT,
  owner UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE FUNCTION storage.foldername(name TEXT) RETURNS TEXT[] LANGUAGE sql IMMUTABLE AS $$
  SELECT (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1]
$$;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO anon, authenticated, service_role;

-- Privilèges par défaut du schéma public sur Supabase (les migrations les restreignent ensuite)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

CREATE PUBLICATION supabase_realtime;
`;

export interface MigrationReport {
  file: string;
  ok: boolean;
  error?: string;
}

export interface TestDatabase {
  db: PGlite;
  migrations: MigrationReport[];
}

/** Crée une base vierge : bootstrap Supabase, schema.sql, puis chaque migration (arrêt à la première erreur) */
export async function createTestDatabase(): Promise<TestDatabase> {
  const db = await PGlite.create({ extensions: { btree_gist, uuid_ossp, pgcrypto } });
  await db.exec(SUPABASE_BOOTSTRAP);
  await db.exec(readFileSync(path.join(SUPABASE_DIR, 'schema.sql'), 'utf8'));

  const migrations: MigrationReport[] = [];
  for (const file of migrationFiles()) {
    try {
      await db.exec(readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'));
      migrations.push({ file, ok: true });
    } catch (error) {
      migrations.push({ file, ok: false, error: error instanceof Error ? error.message : String(error) });
      // Une transaction interrompue dans un fichier laisse la session en échec : on la referme
      await db.exec('ROLLBACK').catch(() => undefined);
      break;
    }
  }
  return { db, migrations };
}

export type DbRole = 'anon' | 'authenticated' | 'service_role';

/**
 * Exécute `fn` comme le ferait PostgREST pour une requête de ce rôle/utilisateur :
 * SET LOCAL ROLE + claims JWT dans une transaction annulée à la fin (aucun effet de bord).
 */
export async function asRole<T>(
  db: PGlite,
  role: DbRole,
  userId: string | null,
  fn: (tx: Transaction) => Promise<T>
): Promise<T> {
  let result: T | undefined;
  let failure: unknown;
  await db
    .transaction(async (tx) => {
      const claims = JSON.stringify({ role, ...(userId ? { sub: userId } : {}) });
      await tx.query(`SELECT set_config('request.jwt.claims', $1, true)`, [claims]);
      await tx.exec(`SET LOCAL ROLE ${role}`);
      try {
        result = await fn(tx);
      } catch (error) {
        failure = error;
      }
      await tx.rollback();
    })
    .catch(() => undefined);
  if (failure) throw failure;
  return result as T;
}

/** Message d'erreur PostgreSQL d'une opération attendue en échec (ou null si elle a réussi) */
export async function errorOf(promise: Promise<unknown>): Promise<string | null> {
  try {
    await promise;
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}
