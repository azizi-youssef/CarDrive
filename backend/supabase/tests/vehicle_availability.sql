-- Run after migrations on a disposable Supabase database with pgTAP enabled.
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
BEGIN;
SET LOCAL search_path TO extensions, public;

SELECT plan(14);

INSERT INTO public.agencies (
    id, name, slug, phone, whatsapp, email, address, city, status, verified
) VALUES (
    '20000000-0000-0000-0000-000000000098',
    'Availability Test Agency',
    'availability-test-agency',
    '+10000000098',
    '+10000000098',
    'availability-agency@test.invalid',
    'Test',
    'Test',
    'ACTIVE',
    true
);

INSERT INTO public.vehicles (
    id, agency_id, unit_number, brand, model, slug, year, category,
    transmission, fuel, daily_price, status, published
) VALUES (
    '40000000-0000-0000-0000-000000000098',
    '20000000-0000-0000-0000-000000000098',
    'AVAILABILITY-TEST-01',
    'Test',
    'Vehicle',
    'availability-test-vehicle',
    2024,
    'SUV',
    'MANUAL',
    'DIESEL',
    100,
    'AVAILABLE',
    true
);

INSERT INTO auth.users (
    id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES
    ('10000000-0000-0000-0000-000000000098', 'authenticated', 'authenticated', 'availability-a@test.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    ('10000000-0000-0000-0000-000000000097', 'authenticated', 'authenticated', 'availability-b@test.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

INSERT INTO public.agencies (
    id, name, slug, phone, whatsapp, email, address, city, status, verified
) VALUES (
    '20000000-0000-0000-0000-000000000097',
    'Availability Test Agency B',
    'availability-test-agency-b',
    '+10000000097',
    '+10000000097',
    'availability-agency-b@test.invalid',
    'Test',
    'Test',
    'ACTIVE',
    true
);

INSERT INTO public.agency_members (agency_id, user_id, role, status) VALUES
    ('20000000-0000-0000-0000-000000000098', '10000000-0000-0000-0000-000000000098', 'agency_admin', 'ACTIVE'),
    ('20000000-0000-0000-0000-000000000097', '10000000-0000-0000-0000-000000000097', 'agency_admin', 'ACTIVE');

INSERT INTO public.vehicles (
    id, agency_id, unit_number, brand, model, slug, year, category,
    transmission, fuel, daily_price, status, published
) VALUES (
    '40000000-0000-0000-0000-000000000097',
    '20000000-0000-0000-0000-000000000097',
    'AVAILABILITY-TEST-02',
    'Test',
    'Vehicle B',
    'availability-test-vehicle-b',
    2024,
    'SUV',
    'MANUAL',
    'DIESEL',
    100,
    'AVAILABLE',
    true
);

SELECT ok(
    EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conname = 'no_overlapping_confirmed_bookings'
           AND conrelid = 'public.bookings'::regclass
    ),
    'accepted reservations have a database exclusion constraint'
);
SELECT ok(
    NOT has_table_privilege('anon', 'public.vehicle_unavailability', 'SELECT'),
    'anonymous users cannot read private agency unavailability records'
);
SELECT ok(
    has_function_privilege(
        'anon',
        'public.vehicle_availability(uuid[],date,date)',
        'EXECUTE'
    ),
    'anonymous users can check availability without accessing booking records'
);

SELECT is(
    (SELECT available
       FROM public.vehicle_availability(
           ARRAY['40000000-0000-0000-0000-000000000098'::UUID],
           DATE '2027-10-12',
           DATE '2027-10-14'
       )),
    true,
    'a published vehicle without a blocking booking is available'
);

INSERT INTO public.bookings (
    booking_ref, vehicle_id, agency_id, customer_name, customer_email,
    customer_phone, start_date, end_date, total_days, daily_price,
    total_price, deposit_amount, status
) VALUES (
    'CD-AVAILABILITY-TEST-01',
    '40000000-0000-0000-0000-000000000098',
    '20000000-0000-0000-0000-000000000098',
    'Synthetic Customer',
    'availability-customer@test.invalid',
    '+10000000097',
    DATE '2027-10-12',
    DATE '2027-10-14',
    2,
    100,
    200,
    100,
    'PENDING'
);

SELECT is(
    (SELECT available
       FROM public.vehicle_availability(
           ARRAY['40000000-0000-0000-0000-000000000098'::UUID],
           DATE '2027-10-13',
           DATE '2027-10-15'
       )),
    true,
    'pending customer requests do not hold dates without an expiry policy'
);

UPDATE public.bookings
   SET status = 'CONFIRMED'
 WHERE booking_ref = 'CD-AVAILABILITY-TEST-01';

SELECT is(
    (SELECT available
       FROM public.vehicle_availability(
           ARRAY['40000000-0000-0000-0000-000000000098'::UUID],
           DATE '2027-10-13',
           DATE '2027-10-15'
       )),
    false,
    'an overlapping confirmed booking makes the vehicle unavailable'
);

SELECT throws_ok(
    $$INSERT INTO public.vehicle_unavailability (
        vehicle_id, agency_id, start_date, end_date, reason
    ) VALUES (
        '40000000-0000-0000-0000-000000000098',
        '20000000-0000-0000-0000-000000000098',
        DATE '2027-10-14',
        DATE '2027-10-16',
        'CUSTOM'
    )$$,
    '23P01',
    'Agency unavailability conflicts with a confirmed booking',
    'manual blocks cannot be added over a confirmed booking'
);

SELECT throws_ok(
    $$INSERT INTO public.bookings (
        booking_ref, vehicle_id, agency_id, customer_name, customer_email,
        customer_phone, start_date, end_date, total_days, daily_price,
        total_price, deposit_amount, status
    ) VALUES (
        'CD-AVAILABILITY-TEST-02',
        '40000000-0000-0000-0000-000000000098',
        '20000000-0000-0000-0000-000000000098',
        'Synthetic Customer',
        'availability-customer@test.invalid',
        '+10000000097',
        DATE '2027-10-14',
        DATE '2027-10-16',
        2,
        100,
        200,
        100,
        'CONFIRMED'
    )$$,
    '23P01',
    'conflicting key value violates exclusion constraint "no_overlapping_confirmed_bookings"',
    'the exclusion constraint rejects a second overlapping confirmation'
);

SELECT is(
    (SELECT available
       FROM public.vehicle_availability(
           ARRAY['40000000-0000-0000-0000-000000000098'::UUID],
           DATE '2027-10-16',
           DATE '2027-10-18'
       )),
    true,
    'a confirmed reservation outside the requested dates does not block availability'
);

UPDATE public.bookings
   SET status = 'CANCELLED'
 WHERE booking_ref = 'CD-AVAILABILITY-TEST-01';

SELECT is(
    (SELECT available
       FROM public.vehicle_availability(
           ARRAY['40000000-0000-0000-0000-000000000098'::UUID],
           DATE '2027-10-13',
           DATE '2027-10-15'
       )),
    true,
    'cancelling a confirmed booking releases its dates'
);

UPDATE public.bookings
   SET status = 'CONFIRMED'
 WHERE booking_ref = 'CD-AVAILABILITY-TEST-01';

INSERT INTO public.vehicle_unavailability (
    vehicle_id, agency_id, start_date, end_date, reason
) VALUES (
    '40000000-0000-0000-0000-000000000098',
    '20000000-0000-0000-0000-000000000098',
    DATE '2027-10-20',
    DATE '2027-10-21',
    'MAINTENANCE'
);

INSERT INTO public.vehicle_unavailability (
    vehicle_id, agency_id, start_date, end_date, reason
) VALUES (
    '40000000-0000-0000-0000-000000000097',
    '20000000-0000-0000-0000-000000000097',
    DATE '2027-10-20',
    DATE '2027-10-21',
    'CUSTOM'
);

SELECT is(
    (SELECT available
       FROM public.vehicle_availability(
           ARRAY['40000000-0000-0000-0000-000000000098'::UUID],
           DATE '2027-10-20',
           DATE '2027-10-21'
       )),
    false,
    'agency maintenance blocks the affected dates'
);

SELECT throws_ok(
    $$UPDATE public.bookings
         SET agency_id = '20000000-0000-0000-0000-000000000097'
       WHERE booking_ref = 'CD-AVAILABILITY-TEST-01'$$,
    '23514',
    'Booking agency must own the selected vehicle',
    'a booking cannot be assigned to an agency that does not own its vehicle'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000098', true);
SELECT is(
    (SELECT count(*)::INTEGER
       FROM public.vehicle_unavailability
      WHERE vehicle_id = '40000000-0000-0000-0000-000000000098'),
    1,
    'agency members can read their own vehicle availability periods'
);
SELECT is(
    (SELECT count(*)::INTEGER
       FROM public.vehicle_unavailability
      WHERE vehicle_id = '40000000-0000-0000-0000-000000000097'),
    0,
    'agency members cannot read another agency vehicle availability periods'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
