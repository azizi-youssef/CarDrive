-- Run after migrations on a disposable Supabase database with pgTAP enabled.
-- The inserted auth user and generated profile are rolled back at the end.
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
BEGIN;
SET LOCAL search_path TO extensions, public;

SELECT plan(3);

INSERT INTO auth.users (
    id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
    '10000000-0000-0000-0000-000000000097',
    'authenticated',
    'authenticated',
    'oauth-profile-bootstrap@test.invalid',
    '',
    now(),
    '{}'::jsonb,
    '{"full_name":"OAuth Test User","role":"SUPER_ADMIN"}'::jsonb,
    now(),
    now()
);

SELECT is(
    (SELECT role FROM public.profiles WHERE id = '10000000-0000-0000-0000-000000000097'),
    'CUSTOMER',
    'OAuth signup creates a profile with the least-privileged role'
);
SELECT is(
    (SELECT full_name FROM public.profiles WHERE id = '10000000-0000-0000-0000-000000000097'),
    'OAuth Test User',
    'OAuth signup copies the display name into the profile'
);
SELECT ok(
    EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'on_auth_user_created'
          AND tgrelid = 'auth.users'::regclass
          AND NOT tgisinternal
    ),
    'auth user profile bootstrap trigger is installed'
);

SELECT * FROM finish();
ROLLBACK;
