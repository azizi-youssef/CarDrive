-- vehicle_availability() appelle expire_completed_bookings(), qui fait des UPDATE.
-- Une fonction STABLE s'exécute en lecture seule : PostgreSQL rejette alors l'appel
-- (« cannot execute ... in a read-only transaction », code 25006) et toute recherche
-- avec dates échoue. La fonction doit donc être VOLATILE.
ALTER FUNCTION public.vehicle_availability(UUID[], DATE, DATE) VOLATILE;

NOTIFY pgrst, 'reload schema';
