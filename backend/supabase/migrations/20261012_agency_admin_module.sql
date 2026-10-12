-- ========================================================================
-- CarDrive: Super Admin Agency Management Module
-- Migration: 20261012_agency_admin_module.sql
-- ========================================================================

-- 1. Ensure archived_at column exists on agencies
ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_agencies_archived_at
ON public.agencies(archived_at) WHERE archived_at IS NULL;

-- 2. Ensure status column exists on agency_members with default 'ACTIVE'
ALTER TABLE public.agency_members
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE'
CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INVITED', 'REVOKED'));

CREATE INDEX IF NOT EXISTS idx_agency_members_user_status
ON public.agency_members(user_id, status);

-- 3. Case-insensitive unique index on active agency emails to prevent collisions
CREATE UNIQUE INDEX IF NOT EXISTS idx_agencies_active_email_unique
ON public.agencies (lower(email))
WHERE archived_at IS NULL;

-- 4. Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created
ON public.audit_logs(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
ON public.audit_logs(entity_type, entity_id);

-- 5. RLS Policies: Ensure Super Admin and Platform Admin can manage all agencies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'agencies' AND policyname = 'Platform admins have full access to agencies'
    ) THEN
        CREATE POLICY "Platform admins have full access to agencies"
        ON public.agencies
        FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid()
                AND p.role IN ('SUPER_ADMIN', 'ADMIN')
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid()
                AND p.role IN ('SUPER_ADMIN', 'ADMIN')
            )
        );
    END IF;
END;
$$;
