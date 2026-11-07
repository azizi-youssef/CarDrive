-- Statistiques agence filtrables par periode, pour le dashboard agence.
-- Reprend EXACTEMENT les regles de commission de agency_report_statistics()
-- (memes statuts, meme COALESCE) afin d'eviter tout ecart entre ecrans.

BEGIN;

CREATE OR REPLACE FUNCTION public.agency_dashboard_statistics(
    p_agency_id UUID,
    p_from      DATE DEFAULT NULL,
    p_to        DATE DEFAULT NULL
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
        -- Compteurs flotte (etat instantane, non filtre par date)
        'totalVehicles', (
            SELECT count(*) FROM public.vehicles
            WHERE agency_id = p_agency_id AND archived_at IS NULL
        ),
        'availableVehicles', (
            SELECT count(*) FROM public.vehicles
            WHERE agency_id = p_agency_id AND archived_at IS NULL AND status = 'AVAILABLE'
        ),
        'reservedVehicles', (
            SELECT count(*) FROM public.vehicles
            WHERE agency_id = p_agency_id AND archived_at IS NULL AND status = 'BLOCKED'
        ),
        'rentedVehicles', (
            SELECT count(*) FROM public.vehicles
            WHERE agency_id = p_agency_id AND archived_at IS NULL AND status = 'RENTED'
        ),
        'maintenanceVehicles', (
            SELECT count(*) FROM public.vehicles
            WHERE agency_id = p_agency_id AND archived_at IS NULL AND status = 'MAINTENANCE'
        ),

        -- Reservations a traiter (file d'attente agence)
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

        -- Financier : memes regles de commission que agency_report_statistics
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

        -- Taux d'occupation : instantane flotte (non filtre par date)
        'occupancyRate', COALESCE((
            SELECT round(
                100.0 * count(*) FILTER (WHERE status = 'RENTED') / NULLIF(count(*), 0)
            )
            FROM public.vehicles
            WHERE agency_id = p_agency_id AND archived_at IS NULL
        ), 0)
    ) INTO v_result;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.agency_dashboard_statistics(UUID, DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agency_dashboard_statistics(UUID, DATE, DATE) TO authenticated, service_role;

COMMIT;

-- Listes operationnelles du dashboard (enlevements, retours, activite recente).
BEGIN;

CREATE OR REPLACE FUNCTION public.agency_dashboard_agenda(p_agency_id UUID)
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
        'upcomingPickups', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'reference', COALESCE(b.booking_ref, b.reference),
                'customerName', b.customer_name,
                'startDate', b.start_date,
                'pickupTime', b.pickup_time,
                'pickupLocation', b.pickup_location,
                'vehicleLabel', COALESCE(v.brand || ' ' || v.model, 'Vehicule'),
                'status', b.status
            ) ORDER BY b.start_date ASC, b.pickup_time ASC)
            FROM (
                SELECT * FROM public.bookings
                WHERE agency_id = p_agency_id
                  AND start_date >= CURRENT_DATE
                  AND status IN ('APPROVED', 'CONFIRMED', 'READY_FOR_PICKUP')
                ORDER BY start_date ASC, pickup_time ASC
                LIMIT 8
            ) b
            LEFT JOIN public.vehicles v ON v.id = b.vehicle_id
        ), '[]'::jsonb),
        'upcomingReturns', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'reference', COALESCE(b.booking_ref, b.reference),
                'customerName', b.customer_name,
                'endDate', b.end_date,
                'dropoffTime', b.dropoff_time,
                'vehicleLabel', COALESCE(v.brand || ' ' || v.model, 'Vehicule'),
                'status', b.status
            ) ORDER BY b.end_date ASC)
            FROM (
                SELECT * FROM public.bookings
                WHERE agency_id = p_agency_id
                  AND end_date >= CURRENT_DATE
                  AND status IN ('ACTIVE', 'APPROVED', 'CONFIRMED')
                ORDER BY end_date ASC
                LIMIT 8
            ) b
            LEFT JOIN public.vehicles v ON v.id = b.vehicle_id
        ), '[]'::jsonb),
        'recentActivity', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'reference', COALESCE(booking_ref, reference),
                'customerName', customer_name,
                'status', status,
                'totalPrice', total_price,
                'createdAt', created_at
            ) ORDER BY created_at DESC)
            FROM (
                SELECT * FROM public.bookings
                WHERE agency_id = p_agency_id
                ORDER BY created_at DESC
                LIMIT 10
            ) recent
        ), '[]'::jsonb)
    ) INTO v_result;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.agency_dashboard_agenda(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agency_dashboard_agenda(UUID) TO authenticated, service_role;

COMMIT;
