-- Align agency-wide RLS access with the platform permission helpers.
-- ADMIN is not a super administrator in is_super_admin()/has_platform_permission().
BEGIN;

DROP POLICY IF EXISTS "Platform admins have full access to agencies" ON public.agencies;
CREATE POLICY "Super admins have full access to agencies"
    ON public.agencies FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Keep SUSPENDED as a representable membership state, while permission helpers
-- continue to grant access only to ACTIVE memberships.
ALTER TABLE public.agency_members
    DROP CONSTRAINT IF EXISTS agency_members_status_check,
    DROP CONSTRAINT IF EXISTS status_check;

ALTER TABLE public.agency_members
    ADD CONSTRAINT agency_members_status_check
    CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INVITED', 'REVOKED'));

COMMIT;
