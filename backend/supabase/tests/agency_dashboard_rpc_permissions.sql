-- Run after migrations on a disposable Supabase database with pgTAP enabled.
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
BEGIN;
SET LOCAL search_path TO extensions, public;

SELECT plan(11);

SELECT ok(
    to_regprocedure('public.agency_dashboard_statistics(uuid,date,date)') IS NOT NULL,
    'agency dashboard statistics RPC exists with the frontend parameter signature'
);
SELECT ok(
    to_regprocedure('public.agency_dashboard_agenda(uuid)') IS NOT NULL,
    'agency dashboard agenda RPC exists with the frontend parameter signature'
);
SELECT ok(
    has_function_privilege('authenticated', 'public.agency_dashboard_statistics(uuid,date,date)', 'EXECUTE'),
    'authenticated users may call the permission-checked statistics RPC'
);
SELECT ok(
    has_function_privilege('authenticated', 'public.agency_dashboard_agenda(uuid)', 'EXECUTE'),
    'authenticated users may call the permission-checked agenda RPC'
);
SELECT ok(
    NOT has_function_privilege('anon', 'public.agency_dashboard_statistics(uuid,date,date)', 'EXECUTE'),
    'anonymous users cannot call the statistics RPC'
);
SELECT ok(
    NOT has_function_privilege('anon', 'public.agency_dashboard_agenda(uuid)', 'EXECUTE'),
    'anonymous users cannot call the agenda RPC'
);
SELECT ok(
    (SELECT prosecdef FROM pg_proc WHERE oid = 'public.agency_dashboard_statistics(uuid,date,date)'::regprocedure),
    'statistics RPC runs as a security definer and checks agency report permission'
);
SELECT ok(
    position(
        'archived_at' IN pg_get_functiondef('public.agency_dashboard_statistics(uuid,date,date)'::regprocedure)
    ) = 0,
    'statistics RPC uses the existing vehicle schema without an archived_at column'
);
SELECT ok(
    (SELECT prosecdef FROM pg_proc WHERE oid = 'public.agency_dashboard_agenda(uuid)'::regprocedure),
    'agenda RPC runs as a security definer and checks agency report permission'
);
SELECT ok(
    has_column_privilege('authenticated', 'public.bookings', 'customer_name', 'SELECT'),
    'authenticated booking readers can select the customer name required by the booking list'
);
SELECT ok(
    NOT has_column_privilege('authenticated', 'public.bookings', 'customer_email', 'SELECT'),
    'booking list access does not grant customer email access'
);

SELECT * FROM finish();
ROLLBACK;
