-- Limitation de débit distribuée (partagée entre toutes les instances Next.js).
-- Utilisée par frontend/src/lib/rate-limit.ts via supabase.rpc('consume_api_rate_limit').

BEGIN;

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
    key_hash      TEXT PRIMARY KEY,
    hit_count     INTEGER NOT NULL DEFAULT 0,
    window_start  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Aucune policy : seules les fonctions SECURITY DEFINER et le service_role y accèdent.
DROP POLICY IF EXISTS "No direct access to rate limits" ON public.api_rate_limits;
CREATE POLICY "No direct access to rate limits"
    ON public.api_rate_limits FOR ALL
    USING (false)
    WITH CHECK (false);

REVOKE ALL ON TABLE public.api_rate_limits FROM PUBLIC, anon, authenticated;

-- Suppression préalable pour éviter l'erreur "cannot change return type of existing function"
DROP FUNCTION IF EXISTS public.consume_api_rate_limit(TEXT, INTEGER, INTEGER);

CREATE FUNCTION public.consume_api_rate_limit(
    p_key_hash       TEXT,
    p_limit          INTEGER,
    p_window_seconds INTEGER
)
RETURNS TABLE (allowed BOOLEAN, retry_after_sec INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_row          public.api_rate_limits;
    v_window_start TIMESTAMPTZ;
    v_hits         INTEGER;
    v_allowed      BOOLEAN;
    v_expiry       TIMESTAMPTZ;
BEGIN
    IF p_limit IS NULL OR p_limit < 1 OR p_window_seconds IS NULL OR p_window_seconds < 1 THEN
        RAISE EXCEPTION 'consume_api_rate_limit: paramètres invalides';
    END IF;

    -- Sérialise les accès concurrents sur la même clé.
    PERFORM pg_advisory_xact_lock(hashtext(p_key_hash));

    SELECT * INTO v_row
    FROM public.api_rate_limits
    WHERE key_hash = p_key_hash
    FOR UPDATE;

    IF NOT FOUND OR v_row.window_start + make_interval(secs => p_window_seconds) <= now() THEN
        v_window_start := now();
        v_hits         := 1;
        v_allowed      := true;
    ELSE
        v_window_start := v_row.window_start;
        v_hits         := v_row.hit_count + 1;
        v_allowed      := v_hits <= p_limit;
    END IF;

    v_expiry := v_window_start + make_interval(secs => p_window_seconds);

    INSERT INTO public.api_rate_limits (key_hash, hit_count, window_start, updated_at)
    VALUES (p_key_hash, v_hits, v_window_start, now())
    ON CONFLICT (key_hash) DO UPDATE
        SET hit_count    = EXCLUDED.hit_count,
            window_start = EXCLUDED.window_start,
            updated_at   = now();

    RETURN QUERY SELECT
        v_allowed,
        CASE
            WHEN v_allowed THEN 0
            ELSE GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_expiry - now())))::INTEGER)
        END;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_api_rate_limit(TEXT, INTEGER, INTEGER)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_api_rate_limit(TEXT, INTEGER, INTEGER)
    TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
