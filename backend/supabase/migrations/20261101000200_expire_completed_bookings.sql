-- Expire bookings after their rental period ends and release their vehicles.
-- ACTIVE/RENTED rentals that ended are completed.
-- Accepted but unstarted reservations are expired.

-- Keep the database check constraint aligned with the full booking lifecycle.
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check CHECK (status IN (
      'REQUESTED', 'UNDER_REVIEW', 'SENT_TO_AGENCY', 'AGENCY_REVIEW',
      'APPROVED', 'REJECTED', 'ALTERNATIVE_PROPOSED', 'READY_FOR_PICKUP',
      'ACTIVE', 'RENTED', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'NO_SHOW',
      'PENDING', 'CONFIRMED'
  ));

CREATE OR REPLACE FUNCTION public.expire_completed_bookings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    WITH changed AS (
        UPDATE public.bookings
           SET status = CASE
               WHEN status IN ('ACTIVE', 'RENTED') THEN 'COMPLETED'
               ELSE 'EXPIRED'
           END,
               updated_at = NOW()
         WHERE end_date < CURRENT_DATE
           AND status IN ('APPROVED', 'CONFIRMED', 'ACTIVE', 'RENTED', 'READY_FOR_PICKUP')
        RETURNING vehicle_id
    )
    SELECT count(*) INTO v_count FROM changed;

    -- Keep operational vehicle state aligned when no current or future booking remains.
    UPDATE public.vehicles v
       SET status = 'AVAILABLE'
     WHERE v.status IN ('RENTED', 'BLOCKED')
       AND NOT EXISTS (
           SELECT 1 FROM public.bookings b
            WHERE b.vehicle_id = v.id
              AND b.status IN ('APPROVED', 'CONFIRMED', 'ACTIVE', 'READY_FOR_PICKUP')
              AND b.end_date >= CURRENT_DATE
       );

    RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_completed_bookings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_completed_bookings() TO authenticated, service_role;

-- Backfill records that are already past their period.
SELECT public.expire_completed_bookings();

-- Reapply the availability RPC so existing installations invoke cleanup immediately.
CREATE OR REPLACE FUNCTION public.vehicle_availability(
    p_vehicle_ids UUID[],
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (vehicle_id UUID, available BOOLEAN)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    PERFORM public.expire_completed_bookings();

    IF p_start_date IS NULL OR p_end_date IS NULL OR p_end_date <= p_start_date THEN
        RAISE EXCEPTION 'A valid rental date range is required' USING ERRCODE = '22007';
    END IF;

    IF p_vehicle_ids IS NULL OR cardinality(p_vehicle_ids) > 500 THEN
        RAISE EXCEPTION 'At most 500 vehicle IDs may be checked at once' USING ERRCODE = '22023';
    END IF;

    RETURN QUERY
    WITH requested AS (
        SELECT DISTINCT unnest(p_vehicle_ids) AS id
    )
    SELECT requested.id,
           COALESCE(
               v.id IS NOT NULL AND v.published AND v.archived_at IS NULL
               AND a.status = 'ACTIVE' AND a.archived_at IS NULL
               AND v.status::TEXT IN ('AVAILABLE', 'RENTED')
               AND NOT EXISTS (
                   SELECT 1 FROM public.bookings b
                    WHERE b.vehicle_id = v.id
                      AND b.status IN ('APPROVED', 'CONFIRMED', 'ACTIVE', 'READY_FOR_PICKUP')
                      AND b.end_date >= CURRENT_DATE
                      AND daterange(b.start_date, b.end_date, '[]')
                          && daterange(p_start_date, p_end_date, '[]')
               )
               AND NOT EXISTS (
                   SELECT 1 FROM public.vehicle_unavailability u
                    WHERE u.vehicle_id = v.id
                      AND daterange(u.start_date, u.end_date, '[]')
                          && daterange(p_start_date, p_end_date, '[]')
               ), FALSE
           )
      FROM requested
      LEFT JOIN public.vehicles v ON v.id = requested.id
      LEFT JOIN public.agencies a ON a.id = v.agency_id;
END;
$$;

REVOKE ALL ON FUNCTION public.vehicle_availability(UUID[], DATE, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vehicle_availability(UUID[], DATE, DATE)
    TO anon, authenticated, service_role;

-- Run the same cleanup every day at 00:05 when pg_cron is installed.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
        BEGIN
            CREATE EXTENSION IF NOT EXISTS pg_cron;
            PERFORM cron.schedule(
                'klickdrive-expire-completed-bookings',
                '5 0 * * *',
                'SELECT public.expire_completed_bookings()'
            );
        EXCEPTION WHEN insufficient_privilege THEN
            NULL;
        END;
    END IF;
END;
$$;
