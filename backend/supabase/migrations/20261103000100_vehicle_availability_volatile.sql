-- Correctif : la recherche avec dates échouait (« cannot execute SELECT in a read-only
-- transaction », code 25006) car vehicle_availability(), déclarée STABLE, appelait
-- expire_completed_bookings() qui fait des UPDATE.
--
-- vehicle_availability() n'a pas besoin d'écrire : sa requête ignore déjà les réservations
-- terminées (b.end_date >= CURRENT_DATE) et accepte les statuts AVAILABLE et RENTED.
-- On retire donc l'appel ; la fonction redevient en lecture seule (STABLE), ce qui fonctionne
-- quel que soit l'état du cache de schéma de l'API.
-- Le nettoyage des statuts reste assuré par pg_cron (00:05) et par le serveur, qui appelle
-- expire_completed_bookings() séparément avant chaque recherche avec dates.
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

NOTIFY pgrst, 'reload schema';
