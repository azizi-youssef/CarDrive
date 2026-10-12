-- Run after migrations on a disposable Supabase database with pgTAP enabled.
-- All fixtures are transaction-scoped and use reserved .invalid email addresses.
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
BEGIN;
SET LOCAL search_path TO extensions, public;

SELECT plan(16);

INSERT INTO auth.users (
    id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES
    ('10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'super-admin@access-test.invalid', '', now(), '{}'::jsonb, '{"role":"SUPER_ADMIN"}'::jsonb, now(), now()),
    ('10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'agency-admin@access-test.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    ('10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'viewer@access-test.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    ('10000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'other-agency@access-test.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    ('10000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'invited@access-test.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    ('10000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'platform-admin@access-test.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now())
ON CONFLICT (id) DO NOTHING;

UPDATE public.profiles SET role = 'SUPER_ADMIN'
WHERE id = '10000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET role = 'ADMIN'
WHERE id = '10000000-0000-0000-0000-000000000006';

INSERT INTO public.agencies (
    id, name, slug, phone, whatsapp, email, address, city, status, verified
) VALUES
    ('20000000-0000-0000-0000-000000000001', 'Agency A Test', 'agency-a-access-test', '+10000000001', '+10000000001', 'agency-a@access-test.invalid', 'Test A', 'Test', 'ACTIVE', true),
    ('20000000-0000-0000-0000-000000000002', 'Agency B Test', 'agency-b-access-test', '+10000000002', '+10000000002', 'agency-b@access-test.invalid', 'Test B', 'Test', 'ACTIVE', true),
    ('20000000-0000-0000-0000-000000000003', 'Agency C Test', 'agency-c-access-test', '+10000000003', '+10000000003', 'agency-c@access-test.invalid', 'Test C', 'Test', 'SUSPENDED', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.agency_members (agency_id, user_id, role, status)
VALUES
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'agency_admin', 'ACTIVE'),
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'viewer', 'ACTIVE'),
    ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'agency_admin', 'ACTIVE'),
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'agency_agent', 'INVITED'),
    ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000006', 'agency_agent', 'SUSPENDED')
ON CONFLICT (agency_id, user_id) DO NOTHING;

SELECT is(
    (SELECT role FROM public.profiles WHERE id = '10000000-0000-0000-0000-000000000001'),
    'CUSTOMER',
    'signup metadata cannot grant the super_admin profile role'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
SELECT ok(public.has_platform_permission('agencies.delete'), 'super_admin has the global archive permission');

SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000006', true);
SELECT ok(NOT public.has_platform_permission('agencies.read'), 'ADMIN profile is not a super-admin platform principal');
SELECT is(
    (SELECT count(*)::INTEGER FROM public.agencies WHERE id = '20000000-0000-0000-0000-000000000003'),
    0,
    'ADMIN cannot read a suspended agency through the all-agencies policy'
);
SELECT ok(NOT public.has_agency_permission('20000000-0000-0000-0000-000000000003', 'vehicles.read'), 'SUSPENDED membership grants no agency permission');
SELECT is(
    (SELECT status FROM public.agency_members WHERE agency_id = '20000000-0000-0000-0000-000000000003' AND user_id = '10000000-0000-0000-0000-000000000006'),
    'SUSPENDED',
    'SUSPENDED membership state is stored and visible to its member'
);
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
SELECT is(
    (SELECT count(*)::INTEGER FROM public.agencies WHERE id = '20000000-0000-0000-0000-000000000003'),
    1,
    'SUPER_ADMIN can read a suspended agency'
);

SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
SELECT ok(public.has_agency_permission('20000000-0000-0000-0000-000000000001', 'bookings.read'), 'agency admin can read its own agency bookings');
SELECT ok(NOT public.has_agency_permission('20000000-0000-0000-0000-000000000002', 'bookings.read'), 'agency admin cannot read another agency');
SELECT ok(NOT public.has_agency_permission('20000000-0000-0000-0000-000000000001', 'agencies.delete'), 'agency admin cannot archive an agency');

SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
SELECT ok(public.has_agency_permission('20000000-0000-0000-0000-000000000001', 'bookings.read'), 'viewer can read authorized booking fields');
SELECT ok(NOT public.has_agency_permission('20000000-0000-0000-0000-000000000001', 'customers.read'), 'viewer cannot read customer dossiers');
SELECT is(
    (SELECT count(*)::INTEGER FROM public.agency_members WHERE agency_id = '20000000-0000-0000-0000-000000000002'),
    0,
    'viewer cannot enumerate members of another agency'
);
SELECT throws_ok(
    $$SELECT customer_email FROM public.bookings LIMIT 1$$,
    '42501',
    'permission denied for table bookings',
    'direct PostgREST role cannot select customer email'
);

SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000005', true);
SELECT ok(NOT public.has_agency_permission('20000000-0000-0000-0000-000000000001', 'bookings.read'), 'invited member has no access before acceptance');

SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
SELECT throws_ok(
    $$UPDATE public.profiles SET role = 'SUPER_ADMIN' WHERE id = '10000000-0000-0000-0000-000000000002'$$,
    '42501',
    'Profile role changes require a trusted administrative operation',
    'authenticated user cannot elevate their profile role'
);

SELECT * FROM finish();
ROLLBACK;
