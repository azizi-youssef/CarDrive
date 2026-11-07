import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { createTestDatabase, migrationFiles, type MigrationReport } from './harness';

/**
 * Qualité des migrations : elles doivent s'appliquer sur une base vierge, dans l'ordre des fichiers,
 * avec des versions uniques (la CLI Supabase enregistre la version = préfixe avant le premier « _ »).
 */
describe('Migrations Supabase', () => {
  let db: PGlite;
  let reports: MigrationReport[];

  beforeAll(async () => {
    const created = await createTestDatabase();
    db = created.db;
    reports = created.migrations;
  });

  afterAll(async () => {
    await db?.close();
  });

  it('chaque fichier de migration a une version unique', () => {
    const versions = migrationFiles().map((file) => file.split('_')[0]);
    const duplicates = versions.filter((version, index) => versions.indexOf(version) !== index);
    expect(duplicates, `versions en double : ${[...new Set(duplicates)].join(', ')}`).toEqual([]);
  });

  it('schema.sql puis toutes les migrations s’appliquent sur une base vierge', () => {
    const failed = reports.find((report) => !report.ok);
    expect(failed, failed ? `${failed.file} : ${failed.error}` : '').toBeUndefined();
    expect(reports).toHaveLength(migrationFiles().length);
  });

  it('les tables sensibles ont la RLS activée', async () => {
    const { rows } = await db.query<{ relname: string; relrowsecurity: boolean }>(
      `SELECT c.relname, c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r'
          AND c.relname IN ('bookings', 'booking_events', 'profiles', 'agency_members', 'agencies', 'vehicles', 'audit_logs')`
    );
    expect(rows.length).toBeGreaterThanOrEqual(7);
    for (const row of rows) expect(row.relrowsecurity, `RLS désactivée sur ${row.relname}`).toBe(true);
  });
});
