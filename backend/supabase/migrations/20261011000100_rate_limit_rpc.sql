-- Limitation de débit distribuée — schema privé, accessible uniquement via service_role.
-- Correction du bug : clause RETURNING invalide sur INSERT...ON CONFLICT dans PostgreSQL.

BEGIN;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.api_rate_limits (
    key_hash         TEXT PRIMARY KEY CHECK (key_hash ~ '^[0-9a-f]{64}$'),
    hit_count        INTEGER NOT NULL CHECK (hit_count > 0),
    window_started_at TIMESTAMPTZ NOT NULL,
    expires_at        TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_expiry
    ON private.api_rate_limits (expires_at);

REVOKE ALL ON TABLE private.api_rate_limits FROM PUBLIC, anon, authenticated;

-- ─── Fonction RPC principale ─────────────────────────────────────────────────
-- Appelée via supabase.rpc('consume_api_rate_limit', { p_key_hash, p_limit, p_window_seconds })
-- Uniquement accessible en service_role (côté serveur Next.js).

DROP FUNCTION IF EXISTS public.consume_api_rate_limit(TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.consume_api_rate_limit(
    p_key_hash       TEXT,
    p_limit          INTEGER,
    p_window_seconds INTEGER
)
RETURNS TABLE (allowed BOOLEAN, retry_after_sec INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, private
AS $$
DECLARE
    v_now   TIMESTAMPTZ := clock_timestamp();
    v_count INTEGER;
    v_expiry TIMESTAMPTZ;
BEGIN
    -- Vérifications de sécurité : seul le service_role peut appeler cette fonction.
    IF auth.role() IS DISTINCT FROM 'service_role'
       OR p_key_hash IS NULL
       OR p_key_hash !~ '^[0-9a-f]{64}$'
       OR p_limit IS NULL OR p_limit < 1 OR p_limit > 1000
       OR p_window_seconds IS NULL OR p_window_seconds < 1 OR p_window_seconds > 86400
    THEN
        RAISE EXCEPTION 'Invalid rate limit request' USING ERRCODE = '42501';
    END IF;

    -- Verrou atomique sur la clé pour éviter les race conditions.
    PERFORM pg_advisory_xact_lock(hashtext(p_key_hash));

    -- Upsert de la fenêtre de limitation.
    -- CORRECTION : utiliser EXCLUDED pour référencer les valeurs insérées dans ON CONFLICT,
    --              et lire le résultat APRÈS avec un SELECT séparé (pas de RETURNING qualifié).
    INSERT INTO private.api_rate_limits (key_hash, hit_count, window_started_at, expires_at)
    VALUES (
        p_key_hash,
        1,
        v_now,
        v_now + make_interval(secs => p_window_seconds)
    )
    ON CONFLICT (key_hash) DO UPDATE
        SET hit_count        = CASE
                                   WHEN private.api_rate_limits.expires_at <= v_now THEN 1
                                   ELSE private.api_rate_limits.hit_count + 1
                               END,
            window_started_at = CASE
                                    WHEN private.api_rate_limits.expires_at <= v_now THEN v_now
                                    ELSE private.api_rate_limits.window_started_at
                                END,
            expires_at       = CASE
                                   WHEN private.api_rate_limits.expires_at <= v_now
                                       THEN v_now + make_interval(secs => p_window_seconds)
                                   ELSE private.api_rate_limits.expires_at
                               END;

    -- Lecture du résultat après upsert (SELECT séparé — syntaxe portable PostgreSQL).
    SELECT hit_count, expires_at
      INTO v_count, v_expiry
      FROM private.api_rate_limits
     WHERE key_hash = p_key_hash;

    -- Nettoyage des entrées expirées (best-effort, limité à 500 lignes).
    DELETE FROM private.api_rate_limits
    WHERE key_hash IN (
        SELECT key_hash
          FROM private.api_rate_limits
         WHERE expires_at <= v_now
         ORDER BY expires_at
         LIMIT 500
    );

    -- Résultat : allowed = true si en dessous de la limite.
    RETURN QUERY SELECT
        v_count <= p_limit,
        GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_expiry - v_now)))::INTEGER);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_api_rate_limit(TEXT, INTEGER, INTEGER)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_api_rate_limit(TEXT, INTEGER, INTEGER)
    TO service_role;

-- Force PostgREST à recharger le cache du schéma.
NOTIFY pgrst, 'reload schema';

COMMIT;
