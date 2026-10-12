BEGIN;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'reviews'
    LOOP
        EXECUTE format('DROP POLICY %I ON public.reviews', policy_record.policyname);
    END LOOP;
END;
$$;

CREATE POLICY "Public can read reviews"
    ON public.reviews FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Customers can review completed bookings" ON public.reviews;
CREATE POLICY "Customers can review completed bookings"
    ON public.reviews FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND customer_id = auth.uid()
        AND author_name = 'Client vérifié'
        AND EXISTS (
            SELECT 1
            FROM public.bookings b
            WHERE b.id = reviews.booking_id
              AND b.customer_id = auth.uid()
              AND b.status = 'COMPLETED'
              AND b.vehicle_id = reviews.vehicle_id
              AND b.agency_id = reviews.agency_id
        )
    );

REVOKE INSERT, UPDATE, DELETE ON TABLE public.reviews FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.reviews TO anon, authenticated;
GRANT INSERT (
    booking_id, vehicle_id, agency_id, customer_id, author_name, rating, comment
) ON TABLE public.reviews TO authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_one_per_booking
    ON public.reviews (booking_id)
    WHERE booking_id IS NOT NULL;

DROP POLICY IF EXISTS "Only admins can modify platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Only super admins can modify platform settings" ON public.platform_settings;
CREATE POLICY "Only super admins can modify platform settings"
    ON public.platform_settings FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

GRANT SELECT (
    id, booking_ref, reference, vehicle_id, agency_id, customer_id, start_date, end_date,
    rental_period, pickup_time, dropoff_time, total_days, daily_price, total_price,
    commission_rate, commission_amount, agency_amount, deposit_amount, status,
    created_at, updated_at, agency_status, commission_status, requested_at,
    reviewed_at, confirmed_at, completed_at, cancelled_at, pdf_url, delivery_type,
    child_seat, additional_driver
) ON TABLE public.bookings TO authenticated;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.api_rate_limits (
    key_hash TEXT PRIMARY KEY CHECK (key_hash ~ '^[0-9a-f]{64}$'),
    hit_count INTEGER NOT NULL CHECK (hit_count > 0),
    window_started_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_expiry
    ON private.api_rate_limits (expires_at);
REVOKE ALL ON TABLE private.api_rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_api_rate_limit(
    p_key_hash TEXT,
    p_limit INTEGER,
    p_window_seconds INTEGER
)
RETURNS TABLE (allowed BOOLEAN, retry_after_sec INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, private
AS $$
DECLARE
    v_now TIMESTAMPTZ := clock_timestamp();
    v_count INTEGER;
    v_expiry TIMESTAMPTZ;
BEGIN
    IF auth.role() <> 'service_role'
       OR p_key_hash !~ '^[0-9a-f]{64}$'
       OR p_limit < 1 OR p_limit > 1000
       OR p_window_seconds < 1 OR p_window_seconds > 86400 THEN
        RAISE EXCEPTION 'Invalid rate limit request' USING ERRCODE = '42501';
    END IF;

    INSERT INTO private.api_rate_limits AS current_limit (
        key_hash, hit_count, window_started_at, expires_at
    )
    VALUES (p_key_hash, 1, v_now, v_now + make_interval(secs => p_window_seconds))
    ON CONFLICT (key_hash) DO UPDATE
       SET hit_count = CASE
               WHEN current_limit.expires_at <= v_now THEN 1
               ELSE current_limit.hit_count + 1
           END,
           window_started_at = CASE
               WHEN current_limit.expires_at <= v_now THEN v_now
               ELSE current_limit.window_started_at
           END,
           expires_at = CASE
               WHEN current_limit.expires_at <= v_now
                   THEN v_now + make_interval(secs => p_window_seconds)
               ELSE current_limit.expires_at
           END
    RETURNING private.api_rate_limits.hit_count, private.api_rate_limits.expires_at
         INTO v_count, v_expiry;

    WITH expired_keys AS (
        SELECT key_hash
        FROM private.api_rate_limits
        WHERE expires_at <= v_now
        ORDER BY expires_at
        LIMIT 500
    )
    DELETE FROM private.api_rate_limits rl
    USING expired_keys
    WHERE rl.key_hash = expired_keys.key_hash;

    RETURN QUERY SELECT
        v_count <= p_limit,
        GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_expiry - v_now)))::INTEGER);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_api_rate_limit(TEXT, INTEGER, INTEGER)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_api_rate_limit(TEXT, INTEGER, INTEGER)
    TO service_role;

CREATE OR REPLACE FUNCTION public.admin_platform_statistics()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    IF NOT public.has_platform_permission('agencies.read') THEN
        RAISE EXCEPTION 'Not authorized to read platform statistics' USING ERRCODE = '42501';
    END IF;

    SELECT jsonb_build_object(
        'totalAgencies', (SELECT count(*) FROM public.agencies WHERE archived_at IS NULL),
        'verifiedAgencies', (SELECT count(*) FROM public.agencies WHERE verified AND archived_at IS NULL),
        'pendingAgencies', (SELECT count(*) FROM public.agencies WHERE status = 'PENDING' AND archived_at IS NULL),
        'totalVehicles', (SELECT count(*) FROM public.vehicles),
        'totalBookings', (SELECT count(*) FROM public.bookings),
        'totalVolume', COALESCE((
            SELECT sum(total_price) FROM public.bookings
            WHERE status IN ('CONFIRMED', 'ACTIVE', 'APPROVED', 'COMPLETED', 'REQUESTED', 'PENDING')
        ), 0),
        'platformCommission', COALESCE((
            SELECT sum(COALESCE(
                NULLIF(commission_amount, 0),
                round(total_price * COALESCE(commission_rate, 15) / 100)
            ))
            FROM public.bookings
            WHERE status IN ('CONFIRMED', 'ACTIVE', 'APPROVED', 'COMPLETED', 'REQUESTED', 'PENDING')
        ), 0),
        'agencyNet', GREATEST(0, COALESCE((
            SELECT sum(total_price) FROM public.bookings
            WHERE status IN ('CONFIRMED', 'ACTIVE', 'APPROVED', 'COMPLETED', 'REQUESTED', 'PENDING')
        ), 0) - COALESCE((
            SELECT sum(COALESCE(
                NULLIF(commission_amount, 0),
                round(total_price * COALESCE(commission_rate, 15) / 100)
            ))
            FROM public.bookings
            WHERE status IN ('CONFIRMED', 'ACTIVE', 'APPROVED', 'COMPLETED', 'REQUESTED', 'PENDING')
        ), 0))
    ) INTO v_result;
    RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.agency_report_statistics(p_agency_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    IF NOT public.has_agency_permission(p_agency_id, 'reports.read') THEN
        RAISE EXCEPTION 'Not authorized to read agency reports' USING ERRCODE = '42501';
    END IF;

    SELECT jsonb_build_object(
        'totalVehicles', (SELECT count(*) FROM public.vehicles WHERE agency_id = p_agency_id),
        'availableVehicles', (SELECT count(*) FROM public.vehicles WHERE agency_id = p_agency_id AND status = 'AVAILABLE'),
        'currentlyRented', (SELECT count(*) FROM public.vehicles WHERE agency_id = p_agency_id AND status = 'RENTED'),
        'pendingBookings', (SELECT count(*) FROM public.bookings WHERE agency_id = p_agency_id AND status IN ('PENDING', 'REQUESTED')),
        'confirmedBookings', (SELECT count(*) FROM public.bookings WHERE agency_id = p_agency_id AND status IN ('CONFIRMED', 'ACTIVE', 'APPROVED')),
        'totalRevenue', COALESCE((
            SELECT sum(total_price) FROM public.bookings
            WHERE agency_id = p_agency_id
              AND status IN ('CONFIRMED', 'ACTIVE', 'APPROVED', 'COMPLETED')
        ), 0),
        'platformCommission', COALESCE((
            SELECT sum(COALESCE(
                NULLIF(commission_amount, 0),
                round(total_price * COALESCE(commission_rate, 15) / 100)
            ))
            FROM public.bookings
            WHERE agency_id = p_agency_id
              AND status IN ('CONFIRMED', 'ACTIVE', 'APPROVED', 'COMPLETED')
        ), 0),
        'netRevenue', GREATEST(0,
            COALESCE((
                SELECT sum(total_price) FROM public.bookings
                WHERE agency_id = p_agency_id
                  AND status IN ('CONFIRMED', 'ACTIVE', 'APPROVED', 'COMPLETED')
            ), 0) - COALESCE((
                SELECT sum(COALESCE(
                    NULLIF(commission_amount, 0),
                    round(total_price * COALESCE(commission_rate, 15) / 100)
                ))
                FROM public.bookings
                WHERE agency_id = p_agency_id
                  AND status IN ('CONFIRMED', 'ACTIVE', 'APPROVED', 'COMPLETED')
            ), 0)
        ),
        'occupancyRate', COALESCE((
            SELECT round(
                100.0 * count(*) FILTER (WHERE status = 'RENTED') / NULLIF(count(*), 0)
            )
            FROM public.vehicles
            WHERE agency_id = p_agency_id
        ), 0)
    ) INTO v_result;
    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_platform_statistics() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.agency_report_statistics(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_platform_statistics() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.agency_report_statistics(UUID) TO authenticated, service_role;

COMMIT;
