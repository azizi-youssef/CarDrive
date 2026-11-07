-- ========================================================================
-- KlickDrive : durcissement de sécurité (audit du 6 novembre 2026)
-- Migration : 20261107000100_security_hardening.sql
--
-- Additive et sans perte de données. Vérifiée par les tests RLS automatisés
-- (frontend/src/tests/db/rls.spec.ts) sur une base vierge avec toutes les migrations.
--
-- 1. Politiques d'écriture « WITH CHECK (true) » héritées : inertes (les privilèges INSERT
--    sont déjà retirés à anon/authenticated) mais supprimées par défense en profondeur.
-- 2. Sur Supabase, les privilèges par défaut accordent EXECUTE à anon sur chaque fonction
--    du schéma public ; les migrations ne retiraient ce droit qu'à PUBLIC. Les fonctions
--    d'administration et d'écriture ne doivent pas être appelables sans session.
--    (Les fonctions utilisées par les politiques RLS restent exécutables : anon en a besoin
--    pour lire le catalogue public.)
-- 3. is_admin() : aligné sur le modèle canonique (SUPER_ADMIN uniquement, ACCESS_CONTROL.md).
--    Plus aucune politique ni fonction ne l'utilise ; conservé pour compatibilité.
-- ========================================================================

BEGIN;

-- 1. Politiques permissives inertes
DROP POLICY IF EXISTS "Anyone can create a booking request" ON public.bookings;
DROP POLICY IF EXISTS "Authorized users can insert booking events" ON public.booking_events;

-- 2. Fonctions d'administration / d'écriture : jamais sans session
REVOKE EXECUTE ON FUNCTION public.invite_agency_member(UUID, UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.change_agency_member_role(UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.revoke_agency_member(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.accept_agency_invitation(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.count_agency_customers(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_agency_overview(UUID) FROM anon;
-- Nettoyage des locations terminées : écrit en base ; réservé aux sessions et au serveur
REVOKE EXECUTE ON FUNCTION public.expire_completed_bookings() FROM anon;

-- 3. Rôle historique ADMIN sans droit global
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.is_super_admin();
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
