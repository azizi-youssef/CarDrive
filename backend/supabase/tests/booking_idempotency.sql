-- Run after migrations on a disposable Supabase database with pgTAP enabled.
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
BEGIN;
SET LOCAL search_path TO extensions, public;

SELECT plan(6);

INSERT INTO public.agencies (
    id, name, slug, phone, whatsapp, email, address, city, status, verified
) VALUES (
    '20000000-0000-0000-0000-000000000099',
    'Idempotency Test Agency',
    'idempotency-test-agency',
    '+10000000099',
    '+10000000099',
    'idempotency-agency@test.invalid',
    'Test',
    'Test',
    'ACTIVE',
    true
);

INSERT INTO public.vehicles (
    id, agency_id, unit_number, brand, model, slug, year, category,
    transmission, fuel, daily_price
) VALUES (
    '40000000-0000-0000-0000-000000000099',
    '20000000-0000-0000-0000-000000000099',
    'IDEMPOTENCY-TEST-01',
    'Test',
    'Vehicle',
    'idempotency-test-vehicle',
    2024,
    'SUV',
    'MANUAL',
    'DIESEL',
    100
);

SELECT ok(
    to_regclass('public.idx_bookings_idempotency_key') IS NOT NULL,
    'booking idempotency keys have a unique database index'
);
SELECT ok(
    NOT has_column_privilege(
        'authenticated', 'public.bookings', 'idempotency_key', 'SELECT'
    ),
    'authenticated users cannot read internal idempotency keys'
);
SELECT ok(
    NOT has_column_privilege(
        'authenticated', 'public.bookings', 'idempotency_key', 'INSERT'
    ),
    'authenticated users cannot set internal idempotency keys'
);
SELECT ok(
    NOT has_column_privilege(
        'authenticated', 'public.bookings', 'idempotency_fingerprint', 'SELECT'
    ),
    'authenticated users cannot read request fingerprints'
);

INSERT INTO public.bookings (
    booking_ref, vehicle_id, agency_id, customer_name, customer_email,
    customer_phone, start_date, end_date, total_days, daily_price,
    total_price, deposit_amount, idempotency_key, idempotency_fingerprint
) VALUES (
    'CD-IDEMPOTENCY-TEST-01',
    '40000000-0000-0000-0000-000000000099',
    '20000000-0000-0000-0000-000000000099',
    'Test Customer',
    'idempotency-customer@test.invalid',
    '+10000000098',
    DATE '2026-10-12',
    DATE '2026-10-13',
    1,
    100,
    100,
    100,
    '30000000-0000-4000-8000-000000000099',
    repeat('a', 64)
);

SELECT throws_ok(
    $$INSERT INTO public.bookings (
        booking_ref, vehicle_id, agency_id, customer_name, customer_email,
        customer_phone, start_date, end_date, total_days, daily_price,
        total_price, deposit_amount, idempotency_key, idempotency_fingerprint
    ) VALUES (
        'CD-IDEMPOTENCY-TEST-02',
        '40000000-0000-0000-0000-000000000099',
        '20000000-0000-0000-0000-000000000099',
        'Test Customer',
        'idempotency-customer@test.invalid',
        '+10000000098',
        DATE '2026-10-12',
        DATE '2026-10-13',
        1,
        100,
        100,
        100,
        '30000000-0000-4000-8000-000000000099',
        repeat('a', 64)
    )$$,
    '23505',
    'duplicate key value violates unique constraint "idx_bookings_idempotency_key"',
    'a retry using the same key cannot create another booking'
);
SELECT is(
    (SELECT count(*)::INTEGER
     FROM public.bookings
     WHERE idempotency_key = '30000000-0000-4000-8000-000000000099'),
    1,
    'one booking remains for the idempotency key'
);

SELECT * FROM finish();
ROLLBACK;
