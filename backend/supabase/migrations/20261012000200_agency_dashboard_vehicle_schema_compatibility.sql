BEGIN;

CREATE OR REPLACE FUNCTION public.agency_dashboard_statistics(
    p_agency_id UUID,
    p_from DATE DEFAULT NULL,
    p_to DATE DEFAULT NULL
)
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

    IF p_from IS NOT NULL AND p_to IS NOT NULL AND p_from > p_to THEN
        RAISE EXCEPTION 'Invalid date range' USING ERRCODE = '22023';
    END IF;

    SELECT jsonb_build_object(
        'totalVehicles', (
            SELECT count(*) FROM public.vehicles
            WHERE agency_id = p_agency_id
        ),
        'availableVehicles', (
            SELECT count(*) FROM public.vehicles
            WHERE agency_id = p_agency_id AND status = 'AVAILABLE'
        ),
        'reservedVehicles', (
            SELECT count(*) FROM public.vehicles
            WHERE agency_id = p_agency_id AND status = 'BLOCKED'
        ),
        'rentedVehicles', (
            SELECT count(*) FROM public.vehicles
            WHERE agency_id = p_agency_id AND status = 'RENTED'
        ),
        'maintenanceVehicles', (
            SELECT count(*) FROM public.vehicles
            WHERE agency_id = p_agency_id AND status = 'MAINTENANCE'
        ),
        'pendingBookings', (
            SELECT count(*) FROM public.bookings
            WHERE agency_id = p_agency_id
              AND status IN ('PENDING', 'REQUESTED', 'UNDER_REVIEW', 'SENT_TO_AGENCY', 'AGENCY_REVIEW')
              AND (p_from IS NULL OR created_at::date >= p_from)
              AND (p_to IS NULL OR created_at::date <= p_to)
        ),
        'confirmedBookings', (
            SELECT count(*) FROM public.bookings
            WHERE agency_id = p_agency_id
              AND status IN ('CONFIRMED', 'ACTIVE', 'APPROVED')
              AND (p_from IS NULL OR created_at::date >= p_from)
              AND (p_to IS NULL OR created_at::date <= p_to)
        ),
        'completedBookings', (
            SELECT count(*) FROM public.bookings
            WHERE agency_id = p_agency_id
              AND status = 'COMPLETED'
              AND (p_from IS NULL OR created_at::date >= p_from)
              AND (p_to IS NULL OR created_at::date <= p_to)
        ),
        'cancelledBookings', (
            SELECT count(*) FROM public.bookings
            WHERE agency_id = p_agency_id
              AND status IN ('CANCELLED', 'REJECTED', 'EXPIRED')
              AND (p_from IS NULL OR created_at::date >= p_from)
              AND (p_to IS NULL OR created_at::date <= p_to)
        ),
        'grossRevenue', COALESCE((
            SELECT sum(total_price) FROM public.bookings
            WHERE agency_id = p_agency_id
              AND status IN ('CONFIRMED', 'ACTIVE', 'APPROVED', 'COMPLETED')
              AND (p_from IS NULL OR created_at::date >= p_from)
              AND (p_to IS NULL OR created_at::date <= p_to)
        ), 0),
        'platformCommission', COALESCE((
            SELECT sum(COALESCE(
                NULLIF(commission_amount, 0),
                round(total_price * COALESCE(commission_rate, 15) / 100)
            ))
            FROM public.bookings
            WHERE agency_id = p_agency_id
              AND status IN ('CONFIRMED', 'ACTIVE', 'APPROVED', 'COMPLETED')
              AND (p_from IS NULL OR created_at::date >= p_from)
              AND (p_to IS NULL OR created_at::date <= p_to)
        ), 0),
        'agencyNet', GREATEST(0,
            COALESCE((
                SELECT sum(total_price) FROM public.bookings
                WHERE agency_id = p_agency_id
                  AND status IN ('CONFIRMED', 'ACTIVE', 'APPROVED', 'COMPLETED')
                  AND (p_from IS NULL OR created_at::date >= p_from)
                  AND (p_to IS NULL OR created_at::date <= p_to)
            ), 0)
            - COALESCE((
                SELECT sum(COALESCE(
                    NULLIF(commission_amount, 0),
                    round(total_price * COALESCE(commission_rate, 15) / 100)
                ))
                FROM public.bookings
                WHERE agency_id = p_agency_id
                  AND status IN ('CONFIRMED', 'ACTIVE', 'APPROVED', 'COMPLETED')
                  AND (p_from IS NULL OR created_at::date >= p_from)
                  AND (p_to IS NULL OR created_at::date <= p_to)
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

REVOKE ALL ON FUNCTION public.agency_dashboard_statistics(UUID, DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agency_dashboard_statistics(UUID, DATE, DATE) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
