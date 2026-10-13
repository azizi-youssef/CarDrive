-- Dynamic vehicle availability and atomic protection against double booking.
-- Pending customer requests do not block dates: no expiry/temporary hold policy exists.

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_blocking_dates
ON public.bookings USING gist (
    vehicle_id,
    daterange(start_date, end_date, '[]')
)
WHERE status IN ('APPROVED', 'CONFIRMED', 'ACTIVE', 'READY_FOR_PICKUP');

ALTER TABLE public.vehicle_unavailability
    ADD COLUMN IF NOT EXISTS cost NUMERIC(10, 2) NOT NULL DEFAULT 0;

DO $$
DECLARE
    v_conflict BOOLEAN;
BEGIN
    IF EXISTS (
        SELECT 1
          FROM public.bookings b
          JOIN public.vehicles v ON v.id = b.vehicle_id
         WHERE b.agency_id IS DISTINCT FROM v.agency_id
    ) OR EXISTS (
        SELECT 1
          FROM public.vehicle_unavailability u
          JOIN public.vehicles v ON v.id = u.vehicle_id
         WHERE u.agency_id IS DISTINCT FROM v.agency_id
    ) THEN
        RAISE EXCEPTION
            'Existing booking or unavailability agency ownership mismatches must be resolved before migration';
    END IF;

    IF EXISTS (
        SELECT 1
          FROM public.bookings b
          JOIN public.vehicle_unavailability u ON u.vehicle_id = b.vehicle_id
         WHERE b.status IN ('APPROVED', 'CONFIRMED', 'ACTIVE', 'READY_FOR_PICKUP')
           AND daterange(b.start_date, b.end_date, '[]')
               && daterange(u.start_date, u.end_date, '[]')
    ) THEN
        RAISE EXCEPTION
            'Existing agency unavailability conflicts with accepted bookings; resolve conflicts before migration';
    END IF;

    IF to_regclass('public.blocked_periods') IS NOT NULL THEN
        EXECUTE $query$
            SELECT EXISTS (
                SELECT 1
                  FROM public.blocked_periods p
                  JOIN public.vehicles v ON v.id = p.vehicle_id
                 WHERE p.agency_id IS DISTINCT FROM v.agency_id
            )
        $query$ INTO v_conflict;
        IF v_conflict THEN
            RAISE EXCEPTION
                'Legacy blocked periods contain agency ownership mismatches; resolve them before migration';
        END IF;
        EXECUTE $query$
            SELECT EXISTS (
                SELECT 1
                  FROM public.blocked_periods p
                  JOIN public.bookings b ON b.vehicle_id = p.vehicle_id
                 WHERE b.status IN ('APPROVED', 'CONFIRMED', 'ACTIVE', 'READY_FOR_PICKUP')
                   AND daterange(b.start_date, b.end_date, '[]')
                       && daterange(p.start_date, p.end_date, '[]')
            )
        $query$ INTO v_conflict;
        IF v_conflict THEN
            RAISE EXCEPTION
                'Legacy blocked periods conflict with accepted bookings; resolve conflicts before migration';
        END IF;
        EXECUTE $query$
            INSERT INTO public.vehicle_unavailability (
                vehicle_id, agency_id, start_date, end_date, reason, notes
            )
            SELECT p.vehicle_id, p.agency_id, p.start_date, p.end_date, 'CUSTOM', p.reason
              FROM public.blocked_periods p
             WHERE NOT EXISTS (
                    SELECT 1
                      FROM public.vehicle_unavailability u
                     WHERE u.vehicle_id = p.vehicle_id
                       AND u.agency_id = p.agency_id
                       AND u.start_date = p.start_date
                       AND u.end_date = p.end_date
                       AND u.reason = 'CUSTOM'
                       AND u.notes IS NOT DISTINCT FROM p.reason
             )
        $query$;
    END IF;

    IF to_regclass('public.maintenance_periods') IS NOT NULL THEN
        EXECUTE $query$
            SELECT EXISTS (
                SELECT 1
                  FROM public.maintenance_periods p
                  JOIN public.vehicles v ON v.id = p.vehicle_id
                 WHERE p.agency_id IS DISTINCT FROM v.agency_id
            )
        $query$ INTO v_conflict;
        IF v_conflict THEN
            RAISE EXCEPTION
                'Legacy maintenance periods contain agency ownership mismatches; resolve them before migration';
        END IF;
        EXECUTE $query$
            SELECT EXISTS (
                SELECT 1
                  FROM public.maintenance_periods p
                  JOIN public.bookings b ON b.vehicle_id = p.vehicle_id
                 WHERE b.status IN ('APPROVED', 'CONFIRMED', 'ACTIVE', 'READY_FOR_PICKUP')
                   AND daterange(b.start_date, b.end_date, '[]')
                       && daterange(p.start_date, p.end_date, '[]')
            )
        $query$ INTO v_conflict;
        IF v_conflict THEN
            RAISE EXCEPTION
                'Legacy maintenance periods conflict with accepted bookings; resolve conflicts before migration';
        END IF;
        EXECUTE $query$
            INSERT INTO public.vehicle_unavailability (
                vehicle_id, agency_id, start_date, end_date, reason, notes, cost
            )
            SELECT p.vehicle_id, p.agency_id, p.start_date, p.end_date, 'MAINTENANCE',
                   p.details, COALESCE(p.cost, 0)
              FROM public.maintenance_periods p
             WHERE NOT EXISTS (
                    SELECT 1
                      FROM public.vehicle_unavailability u
                     WHERE u.vehicle_id = p.vehicle_id
                       AND u.agency_id = p.agency_id
                       AND u.start_date = p.start_date
                       AND u.end_date = p.end_date
                       AND u.reason = 'MAINTENANCE'
                       AND u.notes IS NOT DISTINCT FROM p.details
                       AND u.cost = COALESCE(p.cost, 0)
             )
        $query$;
    END IF;
END;
$$;

-- Replace the snapshot constraint so only accepted/active reservations hold a vehicle.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM public.bookings b1
          JOIN public.bookings b2
            ON b1.vehicle_id = b2.vehicle_id
           AND b1.id < b2.id
           AND daterange(b1.start_date, b1.end_date, '[]')
               && daterange(b2.start_date, b2.end_date, '[]')
         WHERE b1.status IN ('APPROVED', 'CONFIRMED', 'ACTIVE', 'READY_FOR_PICKUP')
           AND b2.status IN ('APPROVED', 'CONFIRMED', 'ACTIVE', 'READY_FOR_PICKUP')
    ) THEN
        RAISE EXCEPTION
            'Existing accepted bookings overlap; resolve the conflicts before applying the availability constraint';
    END IF;
END;
$$;

DO $$
BEGIN
    ALTER TABLE public.bookings
        DROP CONSTRAINT IF EXISTS no_overlapping_confirmed_bookings;

    ALTER TABLE public.bookings
        ADD CONSTRAINT no_overlapping_confirmed_bookings
        EXCLUDE USING gist (
            vehicle_id WITH =,
            daterange(start_date, end_date, '[]') WITH &&
        )
        WHERE (status IN ('APPROVED', 'CONFIRMED', 'ACTIVE', 'READY_FOR_PICKUP'));
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_booking_vehicle_agency()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_vehicle_agency_id UUID;
BEGIN
    SELECT agency_id
      INTO v_vehicle_agency_id
      FROM public.vehicles
     WHERE id = NEW.vehicle_id
     FOR UPDATE;

    IF v_vehicle_agency_id IS NULL THEN
        RAISE EXCEPTION 'Booking vehicle does not exist'
            USING ERRCODE = '23503';
    END IF;

    IF NEW.agency_id IS DISTINCT FROM v_vehicle_agency_id THEN
        RAISE EXCEPTION 'Booking agency must own the selected vehicle'
            USING ERRCODE = '23514';
    END IF;

    IF NEW.status IN ('APPROVED', 'CONFIRMED', 'ACTIVE', 'READY_FOR_PICKUP')
       AND EXISTS (
            SELECT 1
              FROM public.vehicle_unavailability u
             WHERE u.vehicle_id = NEW.vehicle_id
               AND daterange(u.start_date, u.end_date, '[]')
                   && daterange(NEW.start_date, NEW.end_date, '[]')
       ) THEN
        RAISE EXCEPTION 'Confirmed booking conflicts with an agency unavailability period'
            USING ERRCODE = '23P01';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_vehicle_agency_guard ON public.bookings;
CREATE TRIGGER bookings_vehicle_agency_guard
    BEFORE INSERT OR UPDATE OF vehicle_id, agency_id, status, start_date, end_date
    ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_booking_vehicle_agency();

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
    IF p_start_date IS NULL OR p_end_date IS NULL OR p_end_date <= p_start_date THEN
        RAISE EXCEPTION 'A valid rental date range is required'
            USING ERRCODE = '22007';
    END IF;

    IF p_vehicle_ids IS NULL OR cardinality(p_vehicle_ids) > 500 THEN
        RAISE EXCEPTION 'At most 500 vehicle IDs may be checked at once'
            USING ERRCODE = '22023';
    END IF;

    RETURN QUERY
    WITH requested AS (
        SELECT DISTINCT unnest(p_vehicle_ids) AS id
    )
    SELECT
        requested.id,
        COALESCE(
            v.id IS NOT NULL
            AND v.published
            AND v.archived_at IS NULL
            AND a.status = 'ACTIVE'
            AND a.archived_at IS NULL
            -- RENTED is a current global state; its actual rental dates decide future availability.
            AND v.status::TEXT IN ('AVAILABLE', 'RENTED')
            AND NOT EXISTS (
                SELECT 1
                  FROM public.bookings b
                 WHERE b.vehicle_id = v.id
                   AND b.status IN ('APPROVED', 'CONFIRMED', 'ACTIVE', 'READY_FOR_PICKUP')
                   AND daterange(b.start_date, b.end_date, '[]')
                       && daterange(p_start_date, p_end_date, '[]')
            )
            AND NOT EXISTS (
                SELECT 1
                  FROM public.vehicle_unavailability u
                 WHERE u.vehicle_id = v.id
                   AND daterange(u.start_date, u.end_date, '[]')
                       && daterange(p_start_date, p_end_date, '[]')
            ),
            FALSE
        )
    FROM requested
    LEFT JOIN public.vehicles v ON v.id = requested.id
    LEFT JOIN public.agencies a ON a.id = v.agency_id;
END;
$$;

REVOKE ALL ON FUNCTION public.vehicle_availability(UUID[], DATE, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vehicle_availability(UUID[], DATE, DATE)
    TO anon, authenticated, service_role;

-- Manual date blocks remain private to authorized agency staff; the public RPC returns
-- only a boolean and never exposes block reasons or reservation/customer information.
ALTER TABLE public.vehicle_unavailability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agency members read unavailability" ON public.vehicle_unavailability;
DROP POLICY IF EXISTS "Agency members manage unavailability" ON public.vehicle_unavailability;
DROP POLICY IF EXISTS "Authorized members read unavailability" ON public.vehicle_unavailability;
DROP POLICY IF EXISTS "Authorized members create unavailability" ON public.vehicle_unavailability;
DROP POLICY IF EXISTS "Authorized members update unavailability" ON public.vehicle_unavailability;
DROP POLICY IF EXISTS "Authorized members delete unavailability" ON public.vehicle_unavailability;

CREATE POLICY "Authorized members read unavailability"
    ON public.vehicle_unavailability FOR SELECT TO authenticated
    USING (public.has_agency_permission(agency_id, 'vehicles.read'));
CREATE POLICY "Authorized members create unavailability"
    ON public.vehicle_unavailability FOR INSERT TO authenticated
    WITH CHECK (
        public.has_agency_permission(agency_id, 'vehicles.manage')
        AND EXISTS (
            SELECT 1 FROM public.vehicles v
             WHERE v.id = vehicle_id AND v.agency_id = agency_id
        )
    );
CREATE POLICY "Authorized members update unavailability"
    ON public.vehicle_unavailability FOR UPDATE TO authenticated
    USING (public.has_agency_permission(agency_id, 'vehicles.manage'))
    WITH CHECK (
        public.has_agency_permission(agency_id, 'vehicles.manage')
        AND EXISTS (
            SELECT 1 FROM public.vehicles v
             WHERE v.id = vehicle_id AND v.agency_id = agency_id
        )
    );
CREATE POLICY "Authorized members delete unavailability"
    ON public.vehicle_unavailability FOR DELETE TO authenticated
    USING (public.has_agency_permission(agency_id, 'vehicles.manage'));

CREATE OR REPLACE FUNCTION public.validate_vehicle_unavailability_agency()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_vehicle_agency_id UUID;
BEGIN
    SELECT agency_id
      INTO v_vehicle_agency_id
      FROM public.vehicles
     WHERE id = NEW.vehicle_id
     FOR UPDATE;

    IF v_vehicle_agency_id IS NULL OR NEW.agency_id IS DISTINCT FROM v_vehicle_agency_id THEN
        RAISE EXCEPTION 'Unavailability agency must own the selected vehicle'
            USING ERRCODE = '23514';
    END IF;

    IF EXISTS (
        SELECT 1
          FROM public.bookings b
         WHERE b.vehicle_id = NEW.vehicle_id
           AND b.status IN ('APPROVED', 'CONFIRMED', 'ACTIVE', 'READY_FOR_PICKUP')
           AND daterange(b.start_date, b.end_date, '[]')
               && daterange(NEW.start_date, NEW.end_date, '[]')
    ) THEN
        RAISE EXCEPTION 'Agency unavailability conflicts with a confirmed booking'
            USING ERRCODE = '23P01';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vehicle_unavailability_agency_guard
    ON public.vehicle_unavailability;
CREATE TRIGGER vehicle_unavailability_agency_guard
    BEFORE INSERT OR UPDATE OF vehicle_id, agency_id, start_date, end_date
    ON public.vehicle_unavailability
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_vehicle_unavailability_agency();

REVOKE ALL ON TABLE public.vehicle_unavailability FROM anon;
REVOKE ALL ON TABLE public.vehicle_unavailability FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vehicle_unavailability TO authenticated;

COMMENT ON FUNCTION public.vehicle_availability(UUID[], DATE, DATE) IS
    'Public date-specific availability check. Pending requests do not block; accepted/active reservations and agency blocks do.';
