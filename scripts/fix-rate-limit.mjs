import { createClient } from '@supabase/supabase-js';

const url = 'https://wviqbscbnrrpxpojhqql.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2aXFic2NibnJycHhwb2pocXFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDkzMDY1MSwiZXhwIjoyMTA2NTA2NjUxfQ.U0SzFdOvWGL2y56F4ssfM9Ov5xkCWQj6tg56ru0ubQM';

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Test 1 — État actuel de la fonction
console.log('[1] Test de la fonction RPC actuelle...');
const { data: t1, error: e1 } = await supabase.rpc('consume_api_rate_limit', {
  p_key_hash: 'a'.repeat(64),
  p_limit: 10,
  p_window_seconds: 60,
});

if (!e1) {
  console.log('✅ La fonction fonctionne déjà :', JSON.stringify(t1));
  process.exit(0);
}

console.log('❌ Erreur actuelle :', e1.message);
console.log('[2] Application de la correction SQL...\n');

// SQL de correction — réécrit la fonction en utilisant un SELECT séparé après l'upsert
// (corrige l'erreur "invalid reference to FROM-clause entry for table api_rate_limits")
const fixSQL = `
-- Suppression de l'ancienne version buggée
DROP FUNCTION IF EXISTS public.consume_api_rate_limit(TEXT, INTEGER, INTEGER);

-- Recréation avec SELECT séparé après upsert (syntaxe PostgreSQL correcte)
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
    v_now          TIMESTAMPTZ := clock_timestamp();
    v_window_start TIMESTAMPTZ;
    v_expiry       TIMESTAMPTZ;
    v_hits         INTEGER;
    v_allowed      BOOLEAN;
BEGIN
    IF p_key_hash IS NULL OR length(p_key_hash) != 64
       OR p_limit IS NULL OR p_limit < 1 OR p_limit > 10000
       OR p_window_seconds IS NULL OR p_window_seconds < 1 OR p_window_seconds > 86400
    THEN
        RAISE EXCEPTION 'consume_api_rate_limit: paramètres invalides' USING ERRCODE = '22023';
    END IF;

    -- Verrou de ligne pour éviter les race conditions
    PERFORM pg_advisory_xact_lock(hashtext(p_key_hash));

    -- Lire la fenêtre courante
    SELECT hit_count,
           window_start,
           window_start + make_interval(secs => p_window_seconds)
      INTO v_hits, v_window_start, v_expiry
      FROM api_rate_limits
     WHERE key_hash = p_key_hash
       FOR UPDATE;

    IF NOT FOUND OR v_expiry <= v_now THEN
        -- Nouvelle fenêtre
        v_window_start := v_now;
        v_expiry       := v_now + make_interval(secs => p_window_seconds);
        v_hits         := 1;
        v_allowed      := TRUE;
    ELSE
        -- Fenêtre existante
        v_hits    := v_hits + 1;
        v_allowed := v_hits <= p_limit;
    END IF;

    -- Upsert (pas de RETURNING pour éviter le bug de référence de table)
    INSERT INTO api_rate_limits (key_hash, hit_count, window_start, updated_at)
    VALUES (p_key_hash, v_hits, v_window_start, v_now)
    ON CONFLICT (key_hash) DO UPDATE
        SET hit_count    = EXCLUDED.hit_count,
            window_start = EXCLUDED.window_start,
            updated_at   = v_now;

    RETURN QUERY SELECT
        v_allowed,
        CASE
            WHEN v_allowed THEN 0
            ELSE GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_expiry - v_now)))::INTEGER)
        END;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_api_rate_limit(TEXT, INTEGER, INTEGER)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_api_rate_limit(TEXT, INTEGER, INTEGER)
    TO service_role;

NOTIFY pgrst, 'reload schema';
`;

// Appliquer via l'API de gestion Supabase
const projectRef = 'wviqbscbnrrpxpojhqql';
const mgmtRes = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ query: fixSQL }),
  }
);

if (!mgmtRes.ok) {
  const body = await mgmtRes.text().catch(() => '');
  console.log('⚠️  API Management indisponible (' + mgmtRes.status + ').');
  console.log('\n📋 COPIEZ CE SQL dans le SQL Editor Supabase :');
  console.log('   https://supabase.com/dashboard/project/' + projectRef + '/sql/new\n');
  console.log('━'.repeat(70));
  console.log(fixSQL.trim());
  console.log('━'.repeat(70));
  process.exit(1);
}

const body = await mgmtRes.json().catch(() => ({}));
console.log('✅ Correction appliquée :', JSON.stringify(body).slice(0, 200));

// Test 2 — Vérification post-correction
console.log('\n[3] Vérification post-correction...');
await new Promise(r => setTimeout(r, 1500));

const { data: t2, error: e2 } = await supabase.rpc('consume_api_rate_limit', {
  p_key_hash: 'b'.repeat(64),
  p_limit: 5,
  p_window_seconds: 30,
});

if (e2) {
  console.error('❌ Toujours en erreur après correction :', e2.message);
  process.exit(1);
} else {
  console.log('✅ Fonction opérationnelle :', JSON.stringify(t2));
  console.log('\n🎉 Rate limiting distribué fonctionnel. Relancez une réservation.');
}
