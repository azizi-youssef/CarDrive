-- Run after migrations on a disposable Supabase database with pgTAP enabled.
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
BEGIN;
SET LOCAL search_path TO extensions, public;

SELECT plan(8);

SET LOCAL ROLE service_role;
SELECT set_config('request.jwt.claim.role', 'service_role', true);

SELECT ok(
    (SELECT allowed
     FROM public.consume_api_rate_limit(
         'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 2, 60
     )),
    'first request is allowed'
);
SELECT ok(
    (SELECT allowed
     FROM public.consume_api_rate_limit(
         'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 2, 60
     )),
    'request within the configured limit is allowed'
);
SELECT ok(
    NOT (SELECT allowed
         FROM public.consume_api_rate_limit(
             'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 2, 60
         )),
    'requests beyond the configured limit are rejected'
);
SELECT ok(
    (SELECT retry_after_sec > 0
     FROM public.consume_api_rate_limit(
         'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 2, 60
     )),
    'limited requests receive a positive retry interval'
);

SELECT ok(
    (SELECT allowed
     FROM public.consume_api_rate_limit(
         'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 1, 1
     )),
    'a separate key starts an independent window'
);
SELECT pg_sleep(1.1);
SELECT ok(
    (SELECT allowed
     FROM public.consume_api_rate_limit(
         'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 1, 1
     )),
    'expired windows reset the counter'
);

SELECT throws_ok(
    $$SELECT * FROM public.consume_api_rate_limit(
        'invalid', 1, 60
    )$$,
    '42501',
    'Invalid rate limit request',
    'invalid request parameters are rejected'
);

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT throws_ok(
    $$SELECT * FROM public.consume_api_rate_limit(
        'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', 1, 60
    )$$,
    '42501',
    'permission denied for function consume_api_rate_limit',
    'authenticated users cannot call the limiter directly'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
