BEGIN;

CREATE TABLE IF NOT EXISTS public.roles (
    role_key TEXT PRIMARY KEY,
    scope TEXT NOT NULL CHECK (scope IN ('platform', 'agency')),
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.permissions (
    permission_key TEXT PRIMARY KEY,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_key TEXT NOT NULL REFERENCES public.roles(role_key) ON DELETE CASCADE,
    permission_key TEXT NOT NULL REFERENCES public.permissions(permission_key) ON DELETE CASCADE,
    PRIMARY KEY (role_key, permission_key)
);

INSERT INTO public.roles (role_key, scope, description) VALUES
    ('super_admin', 'platform', 'Administration globale de la plateforme'),
    ('agency_admin', 'agency', 'Administration d’une agence'),
    ('agency_manager', 'agency', 'Gestion opérationnelle d’une agence'),
    ('agency_agent', 'agency', 'Traitement des réservations d’une agence'),
    ('viewer', 'agency', 'Consultation en lecture seule')
ON CONFLICT (role_key) DO UPDATE
SET scope = EXCLUDED.scope, description = EXCLUDED.description;

INSERT INTO public.permissions (permission_key, description) VALUES
    ('agencies.read', 'Consulter les agences'),
    ('agencies.create', 'Créer une agence'),
    ('agencies.update', 'Modifier les informations d’une agence'),
    ('agencies.suspend', 'Suspendre ou réactiver une agence'),
    ('agencies.delete', 'Archiver une agence'),
    ('members.read', 'Consulter les membres et l’audit des accès'),
    ('members.invite', 'Inviter des collaborateurs'),
    ('members.update_role', 'Modifier le rôle d’un collaborateur'),
    ('members.revoke', 'Révoquer un collaborateur'),
    ('vehicles.read', 'Consulter les véhicules'),
    ('vehicles.manage', 'Gérer les véhicules'),
    ('bookings.read', 'Consulter les réservations'),
    ('bookings.manage', 'Gérer les réservations'),
    ('customers.read', 'Consulter les données client nécessaires aux locations'),
    ('reports.read', 'Consulter les rapports')
ON CONFLICT (permission_key) DO UPDATE
SET description = EXCLUDED.description;

INSERT INTO public.role_permissions (role_key, permission_key)
SELECT 'super_admin', permission_key FROM public.permissions
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_key, permission_key) VALUES
    ('agency_admin', 'agencies.read'),
    ('agency_admin', 'agencies.update'),
    ('agency_admin', 'members.read'),
    ('agency_admin', 'members.invite'),
    ('agency_admin', 'members.update_role'),
    ('agency_admin', 'members.revoke'),
    ('agency_admin', 'vehicles.read'),
    ('agency_admin', 'vehicles.manage'),
    ('agency_admin', 'bookings.read'),
    ('agency_admin', 'bookings.manage'),
    ('agency_admin', 'customers.read'),
    ('agency_admin', 'reports.read'),
    ('agency_manager', 'agencies.read'),
    ('agency_manager', 'members.read'),
    ('agency_manager', 'members.invite'),
    ('agency_manager', 'vehicles.read'),
    ('agency_manager', 'vehicles.manage'),
    ('agency_manager', 'bookings.read'),
    ('agency_manager', 'bookings.manage'),
    ('agency_manager', 'customers.read'),
    ('agency_manager', 'reports.read'),
    ('agency_agent', 'vehicles.read'),
    ('agency_agent', 'bookings.read'),
    ('agency_agent', 'bookings.manage'),
    ('agency_agent', 'customers.read'),
    ('viewer', 'vehicles.read'),
    ('viewer', 'bookings.read')
ON CONFLICT DO NOTHING;

ALTER TABLE public.agencies
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE public.agency_members
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

ALTER TABLE public.agency_members
    DROP CONSTRAINT IF EXISTS agency_members_role_check,
    DROP CONSTRAINT IF EXISTS agency_members_status_check;

UPDATE public.agency_members
SET role = CASE role
    WHEN 'AGENCY_OWNER' THEN 'agency_admin'
    WHEN 'AGENCY_MANAGER' THEN 'agency_manager'
    WHEN 'AGENCY_STAFF' THEN 'agency_agent'
    ELSE lower(role)
END;

ALTER TABLE public.agency_members
    ADD CONSTRAINT agency_members_role_check
        CHECK (role IN ('agency_admin', 'agency_manager', 'agency_agent', 'viewer')),
    ADD CONSTRAINT agency_members_status_check
        CHECK (status IN ('ACTIVE', 'INVITED', 'REVOKED')),
    ADD CONSTRAINT agency_members_role_fk
    FOREIGN KEY (role) REFERENCES public.roles(role_key);

ALTER TABLE public.agency_members
    ADD CONSTRAINT agency_members_revocation_state_check
    CHECK (
        (status = 'REVOKED' AND revoked_at IS NOT NULL)
        OR (status <> 'REVOKED' AND revoked_at IS NULL)
    );

ALTER TABLE public.audit_logs
    ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS result TEXT NOT NULL DEFAULT 'success';

CREATE INDEX IF NOT EXISTS idx_agency_members_user_status
    ON public.agency_members (user_id, status);
CREATE INDEX IF NOT EXISTS idx_agency_members_agency_status_role
    ON public.agency_members (agency_id, status, role);
CREATE INDEX IF NOT EXISTS idx_agencies_active_created
    ON public.agencies (created_at DESC) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_agency_created
    ON public.audit_logs (agency_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    );
$$;

CREATE OR REPLACE FUNCTION public.has_platform_permission(p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.is_super_admin()
       AND EXISTS (
           SELECT 1 FROM public.role_permissions
           WHERE role_key = 'super_admin' AND permission_key = p_permission
       );
$$;

CREATE OR REPLACE FUNCTION public.has_agency_permission(
    p_agency_id UUID,
    p_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.is_super_admin()
       OR EXISTS (
           SELECT 1
           FROM public.agency_members am
           JOIN public.agencies a ON a.id = am.agency_id
           JOIN public.role_permissions rp ON rp.role_key = am.role
           WHERE am.agency_id = p_agency_id
             AND am.user_id = auth.uid()
             AND am.status = 'ACTIVE'
             AND a.status = 'ACTIVE'
             AND a.archived_at IS NULL
             AND rp.permission_key = p_permission
       );
$$;

CREATE OR REPLACE FUNCTION public.is_agency_member(target_agency_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.agency_members am
        JOIN public.agencies a ON a.id = am.agency_id
        WHERE am.agency_id = target_agency_id
          AND am.user_id = auth.uid()
          AND am.status = 'ACTIVE'
          AND a.archived_at IS NULL
    );
$$;

CREATE OR REPLACE FUNCTION public.can_read_agency_profile(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT target_user_id = auth.uid()
       OR public.is_super_admin()
       OR EXISTS (
           SELECT 1
           FROM public.agency_members target
           JOIN public.agency_members actor
             ON actor.agency_id = target.agency_id
           JOIN public.role_permissions rp ON rp.role_key = actor.role
           WHERE target.user_id = target_user_id
             AND target.status IN ('ACTIVE', 'INVITED')
             AND actor.user_id = auth.uid()
             AND actor.status = 'ACTIVE'
             AND rp.permission_key = 'members.read'
       );
$$;

CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role
       AND COALESCE(auth.role(), '') IN ('anon', 'authenticated') THEN
        RAISE EXCEPTION 'Profile role changes require a trusted administrative operation'
            USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_role_change ON public.profiles;
CREATE TRIGGER prevent_profile_role_change
    BEFORE UPDATE OF role ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_change();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'CUSTOMER'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_agency_access_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_agency_id UUID;
    v_entity_id TEXT;
    v_action TEXT;
    v_metadata JSONB;
BEGIN
    IF TG_TABLE_NAME = 'agencies' THEN
        v_agency_id := COALESCE(NEW.id, OLD.id);
        v_entity_id := v_agency_id::TEXT;
        v_action := CASE
            WHEN TG_OP = 'INSERT' THEN 'agency.created'
            WHEN OLD.archived_at IS NULL AND NEW.archived_at IS NOT NULL THEN 'agency.archived'
            WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'agency.status_changed'
            ELSE 'agency.updated'
        END;
        v_metadata := jsonb_build_object(
            'status', CASE WHEN TG_OP = 'DELETE' THEN OLD.status ELSE NEW.status END,
            'archived', CASE WHEN TG_OP = 'DELETE' THEN OLD.archived_at IS NOT NULL ELSE NEW.archived_at IS NOT NULL END
        );
    ELSE
        v_agency_id := COALESCE(NEW.agency_id, OLD.agency_id);
        v_entity_id := COALESCE(NEW.id, OLD.id)::TEXT;
        v_action := CASE
            WHEN TG_OP = 'INSERT' AND NEW.status = 'INVITED' THEN 'member.invited'
            WHEN TG_OP = 'INSERT' THEN 'member.added'
            WHEN NEW.status = 'REVOKED' AND OLD.status IS DISTINCT FROM 'REVOKED' THEN 'member.revoked'
            WHEN NEW.role IS DISTINCT FROM OLD.role THEN 'member.role_changed'
            ELSE 'member.status_changed'
        END;
        v_metadata := jsonb_build_object(
            'member_id', COALESCE(NEW.user_id, OLD.user_id),
            'role', CASE WHEN TG_OP = 'DELETE' THEN OLD.role ELSE NEW.role END,
            'status', CASE WHEN TG_OP = 'DELETE' THEN OLD.status ELSE NEW.status END
        );
    END IF;

    INSERT INTO public.audit_logs (user_id, agency_id, action, entity_type, entity_id, metadata, result)
    VALUES (
        auth.uid(),
        v_agency_id,
        v_action,
        CASE WHEN TG_TABLE_NAME = 'agencies' THEN 'agency' ELSE 'agency_member' END,
        v_entity_id,
        v_metadata,
        'success'
    );
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS audit_agency_access_change ON public.agencies;
CREATE TRIGGER audit_agency_access_change
    AFTER INSERT OR UPDATE ON public.agencies
    FOR EACH ROW EXECUTE FUNCTION public.audit_agency_access_change();

DROP TRIGGER IF EXISTS audit_agency_member_access_change ON public.agency_members;
CREATE TRIGGER audit_agency_member_access_change
    AFTER INSERT OR UPDATE ON public.agency_members
    FOR EACH ROW EXECUTE FUNCTION public.audit_agency_access_change();

CREATE OR REPLACE FUNCTION public.guard_agency_sensitive_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (NEW.status IS DISTINCT FROM OLD.status OR NEW.archived_at IS DISTINCT FROM OLD.archived_at)
       AND NOT public.is_super_admin()
       AND COALESCE(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Only a super administrator may suspend or archive an agency'
            USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_agency_sensitive_update ON public.agencies;
CREATE TRIGGER guard_agency_sensitive_update
    BEFORE UPDATE OF status, archived_at ON public.agencies
    FOR EACH ROW EXECUTE FUNCTION public.guard_agency_sensitive_update();

CREATE OR REPLACE FUNCTION public.invite_agency_member(
    p_agency_id UUID,
    p_user_id UUID,
    p_role TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_role TEXT;
    v_member_id UUID;
BEGIN
    IF auth.uid() IS NULL OR NOT public.has_agency_permission(p_agency_id, 'members.invite') THEN
        RAISE EXCEPTION 'Not authorized to invite members' USING ERRCODE = '42501';
    END IF;
    IF p_role NOT IN ('agency_admin', 'agency_manager', 'agency_agent', 'viewer') THEN
        RAISE EXCEPTION 'Invalid agency role' USING ERRCODE = '22023';
    END IF;
    SELECT role INTO v_actor_role FROM public.agency_members
    WHERE agency_id = p_agency_id AND user_id = auth.uid() AND status = 'ACTIVE';
    IF NOT public.is_super_admin() AND (
        p_role = 'agency_admin'
        OR (v_actor_role = 'agency_manager' AND p_role NOT IN ('agency_agent', 'viewer'))
    ) THEN
        RAISE EXCEPTION 'Cannot grant a role equal to or above your own' USING ERRCODE = '42501';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Invited account was not created' USING ERRCODE = '23503';
    END IF;

    INSERT INTO public.agency_members (agency_id, user_id, role, status, invited_at, revoked_at)
    VALUES (p_agency_id, p_user_id, p_role, 'INVITED', now(), NULL)
    ON CONFLICT (agency_id, user_id) DO UPDATE
       SET role = EXCLUDED.role, status = 'INVITED', invited_at = now(), revoked_at = NULL
       WHERE public.agency_members.status = 'REVOKED'
    RETURNING id INTO v_member_id;

    IF v_member_id IS NULL THEN
        RAISE EXCEPTION 'This user already has an agency membership' USING ERRCODE = '23505';
    END IF;
    RETURN v_member_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.change_agency_member_role(
    p_member_id UUID,
    p_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_member public.agency_members%ROWTYPE;
    v_actor_role TEXT;
BEGIN
    SELECT * INTO v_member FROM public.agency_members WHERE id = p_member_id FOR UPDATE;
    IF NOT FOUND OR v_member.status = 'REVOKED' THEN
        RAISE EXCEPTION 'Active membership not found' USING ERRCODE = 'P0002';
    END IF;
    IF auth.uid() IS NULL OR auth.uid() = v_member.user_id
       OR NOT public.has_agency_permission(v_member.agency_id, 'members.update_role') THEN
        RAISE EXCEPTION 'Not authorized to change this role' USING ERRCODE = '42501';
    END IF;
    IF p_role NOT IN ('agency_admin', 'agency_manager', 'agency_agent', 'viewer') THEN
        RAISE EXCEPTION 'Invalid agency role' USING ERRCODE = '22023';
    END IF;
    SELECT role INTO v_actor_role FROM public.agency_members
    WHERE agency_id = v_member.agency_id AND user_id = auth.uid() AND status = 'ACTIVE';
    IF NOT public.is_super_admin() AND (
        v_member.role = 'agency_admin'
        OR p_role = 'agency_admin'
        OR (v_actor_role = 'agency_manager' AND p_role NOT IN ('agency_agent', 'viewer'))
    ) THEN
        RAISE EXCEPTION 'Cannot change an equal or higher privileged role' USING ERRCODE = '42501';
    END IF;
    IF v_member.role = 'agency_admin'
       AND v_member.status = 'ACTIVE'
       AND p_role <> 'agency_admin'
       AND (
           SELECT count(*) FROM public.agency_members
           WHERE agency_id = v_member.agency_id
             AND role = 'agency_admin'
             AND status = 'ACTIVE'
       ) <= 1 THEN
        RAISE EXCEPTION 'The last agency administrator cannot be demoted' USING ERRCODE = '23514';
    END IF;
    UPDATE public.agency_members SET role = p_role WHERE id = p_member_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_agency_member(p_member_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_member public.agency_members%ROWTYPE;
    v_actor_role TEXT;
BEGIN
    SELECT * INTO v_member FROM public.agency_members WHERE id = p_member_id FOR UPDATE;
    IF NOT FOUND OR v_member.status = 'REVOKED' THEN
        RAISE EXCEPTION 'Active membership not found' USING ERRCODE = 'P0002';
    END IF;
    IF auth.uid() IS NULL OR auth.uid() = v_member.user_id
       OR NOT public.has_agency_permission(v_member.agency_id, 'members.revoke') THEN
        RAISE EXCEPTION 'Not authorized to revoke this member' USING ERRCODE = '42501';
    END IF;
    SELECT role INTO v_actor_role FROM public.agency_members
    WHERE agency_id = v_member.agency_id AND user_id = auth.uid() AND status = 'ACTIVE';
    IF NOT public.is_super_admin() AND (
        v_member.role = 'agency_admin'
        OR (v_actor_role = 'agency_manager' AND v_member.role NOT IN ('agency_agent', 'viewer'))
    ) THEN
        RAISE EXCEPTION 'Cannot revoke an equal or higher privileged member' USING ERRCODE = '42501';
    END IF;
    IF v_member.role = 'agency_admin' AND v_member.status = 'ACTIVE' AND (
        SELECT count(*) FROM public.agency_members
        WHERE agency_id = v_member.agency_id AND role = 'agency_admin' AND status = 'ACTIVE'
    ) <= 1 THEN
        RAISE EXCEPTION 'The last agency administrator cannot be revoked' USING ERRCODE = '23514';
    END IF;
    UPDATE public.agency_members
       SET status = 'REVOKED', revoked_at = now()
     WHERE id = p_member_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_agency_invitation(p_agency_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;
    UPDATE public.agency_members am
       SET status = 'ACTIVE', revoked_at = NULL
      FROM public.agencies a
     WHERE am.agency_id = p_agency_id
       AND am.user_id = auth.uid()
       AND am.status = 'INVITED'
       AND a.id = am.agency_id
       AND a.status = 'ACTIVE'
       AND a.archived_at IS NULL;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No valid invitation found for this account' USING ERRCODE = 'P0002';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.count_agency_customers(p_agency_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count BIGINT;
BEGIN
    IF NOT public.has_agency_permission(p_agency_id, 'customers.read') THEN
        RAISE EXCEPTION 'Not authorized to read agency customers' USING ERRCODE = '42501';
    END IF;
    SELECT count(*) INTO v_count
    FROM (
        SELECT COALESCE(customer_id::TEXT, lower(customer_email)) AS customer_key
        FROM public.bookings
        WHERE agency_id = p_agency_id
        GROUP BY COALESCE(customer_id::TEXT, lower(customer_email))
    ) customers;
    RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_agency_overview(p_agency_id UUID)
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
        RAISE EXCEPTION 'Not authorized to read agency administration data' USING ERRCODE = '42501';
    END IF;
    SELECT jsonb_build_object(
        'member_count', (SELECT count(*) FROM public.agency_members WHERE agency_id = p_agency_id AND status = 'ACTIVE'),
        'vehicle_count', (SELECT count(*) FROM public.vehicles WHERE agency_id = p_agency_id),
        'booking_count', (SELECT count(*) FROM public.bookings WHERE agency_id = p_agency_id),
        'customer_count', (
            SELECT count(*) FROM (
                SELECT COALESCE(customer_id::TEXT, lower(customer_email))
                FROM public.bookings
                WHERE agency_id = p_agency_id
                GROUP BY COALESCE(customer_id::TEXT, lower(customer_email))
            ) customers
        ),
        'total_volume', COALESCE((
            SELECT sum(total_price) FROM public.bookings
            WHERE agency_id = p_agency_id
              AND status IN ('CONFIRMED', 'ACTIVE', 'APPROVED', 'COMPLETED', 'PENDING', 'REQUESTED')
        ), 0),
        'platform_commission', COALESCE((
            SELECT sum(commission_amount) FROM public.bookings
            WHERE agency_id = p_agency_id
              AND status IN ('CONFIRMED', 'ACTIVE', 'APPROVED', 'COMPLETED', 'PENDING', 'REQUESTED')
        ), 0),
        'last_activity_at', (
            SELECT max(activity_at) FROM (
                SELECT created_at AS activity_at FROM public.audit_logs WHERE agency_id = p_agency_id
                UNION ALL
                SELECT updated_at FROM public.bookings WHERE agency_id = p_agency_id
                UNION ALL
                SELECT updated_at FROM public.vehicles WHERE agency_id = p_agency_id
            ) activity
        ),
        'recent_history', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'action', action,
                'entity_type', entity_type,
                'created_at', created_at,
                'result', result
            ) ORDER BY created_at DESC)
            FROM (
                SELECT action, entity_type, created_at, result
                FROM public.audit_logs
                WHERE agency_id = p_agency_id
                ORDER BY created_at DESC
                LIMIT 10
            ) recent
        ), '[]'::JSONB)
    ) INTO v_result;
    RETURN v_result;
END;
$$;

DROP POLICY IF EXISTS "Public agencies are viewable by everyone" ON public.agencies;
DROP POLICY IF EXISTS "Agency owners and managers can update agency" ON public.agencies;
CREATE POLICY "Public active agencies or authorized members are readable"
    ON public.agencies FOR SELECT
    USING (
        (status = 'ACTIVE' AND archived_at IS NULL)
        OR public.is_super_admin()
        OR public.is_agency_member(id)
    );
CREATE POLICY "Authorized agency members update profile fields"
    ON public.agencies FOR UPDATE
    USING (public.has_agency_permission(id, 'agencies.update'))
    WITH CHECK (public.has_agency_permission(id, 'agencies.update'));
CREATE POLICY "Super administrators create agencies"
    ON public.agencies FOR INSERT
    WITH CHECK (public.has_platform_permission('agencies.create'));
CREATE POLICY "Physical agency deletion is disabled"
    ON public.agencies FOR DELETE
    USING (false);

DROP POLICY IF EXISTS "Profiles are readable by owner or admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles editable by owner or admin" ON public.profiles;
CREATE POLICY "Profiles readable by owner or authorized agency"
    ON public.profiles FOR SELECT
    USING (public.can_read_agency_profile(id));
CREATE POLICY "Profiles editable by owner"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Members readable within authorized agency"
    ON public.agency_members FOR SELECT
    USING (
        user_id = auth.uid()
        OR public.has_agency_permission(agency_id, 'members.read')
    );

DROP POLICY IF EXISTS "Public vehicles viewable by everyone" ON public.vehicles;
DROP POLICY IF EXISTS "Agency members can modify their vehicles" ON public.vehicles;
CREATE POLICY "Published vehicles or authorized agency reads"
    ON public.vehicles FOR SELECT
    USING (
        (published = true AND EXISTS (
            SELECT 1 FROM public.agencies a
            WHERE a.id = vehicles.agency_id AND a.status = 'ACTIVE' AND a.archived_at IS NULL
        ))
        OR public.has_agency_permission(agency_id, 'vehicles.read')
    );
CREATE POLICY "Authorized members manage agency vehicles"
    ON public.vehicles FOR ALL
    USING (public.has_agency_permission(agency_id, 'vehicles.manage'))
    WITH CHECK (public.has_agency_permission(agency_id, 'vehicles.manage'));

DROP POLICY IF EXISTS "Bookings viewable by customer, agency or admin" ON public.bookings;
DROP POLICY IF EXISTS "Agencies and Admins can update booking status" ON public.bookings;
CREATE POLICY "Customers and authorized agency members read bookings"
    ON public.bookings FOR SELECT
    USING (
        customer_id = auth.uid()
        OR public.has_agency_permission(agency_id, 'bookings.read')
    );
CREATE POLICY "Authorized members manage agency bookings"
    ON public.bookings FOR UPDATE
    USING (public.has_agency_permission(agency_id, 'bookings.manage'))
    WITH CHECK (public.has_agency_permission(agency_id, 'bookings.manage'));

DROP POLICY IF EXISTS "Booking events viewable by authorized participants" ON public.booking_events;
CREATE POLICY "Booking events readable by authorized participants"
    ON public.booking_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = booking_events.booking_id
              AND (
                  b.customer_id = auth.uid()
                  OR public.has_agency_permission(b.agency_id, 'bookings.read')
              )
        )
    );

CREATE POLICY "Audit logs readable by super admin or agency managers"
    ON public.audit_logs FOR SELECT
    USING (
        public.is_super_admin()
        OR (agency_id IS NOT NULL AND public.has_agency_permission(agency_id, 'members.read'))
    );

REVOKE SELECT ON TABLE public.bookings FROM PUBLIC, anon, authenticated;
GRANT SELECT (
    id, booking_ref, reference, vehicle_id, agency_id, start_date, end_date,
    rental_period, pickup_time, dropoff_time, total_days, daily_price, total_price,
    commission_rate, commission_amount, agency_amount, deposit_amount, status,
    created_at, updated_at, agency_status, commission_status,
    requested_at, reviewed_at, confirmed_at, completed_at, cancelled_at, pdf_url,
    delivery_type, child_seat, additional_driver
) ON TABLE public.bookings TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.bookings FROM PUBLIC, anon, authenticated;
REVOKE SELECT ON TABLE public.booking_events FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, booking_id, actor_role, event_type, created_at)
    ON TABLE public.booking_events TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.booking_events FROM PUBLIC, anon, authenticated;
REVOKE SELECT ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, email, full_name, role, avatar_url, created_at, updated_at)
    ON TABLE public.profiles TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.agency_members FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.audit_logs FROM PUBLIC, anon, authenticated;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read role definitions"
    ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read permission definitions"
    ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read role permission matrix"
    ON public.role_permissions FOR SELECT TO authenticated USING (true);

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_platform_permission(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_agency_permission(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.invite_agency_member(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.change_agency_member_role(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revoke_agency_member(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_agency_invitation(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.count_agency_customers(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_agency_overview(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.has_platform_permission(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_agency_permission(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_agency_permission(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.can_read_agency_profile(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.invite_agency_member(UUID, UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.change_agency_member_role(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.revoke_agency_member(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.accept_agency_invitation(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.count_agency_customers(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_agency_overview(UUID) TO authenticated, service_role;

COMMIT;
