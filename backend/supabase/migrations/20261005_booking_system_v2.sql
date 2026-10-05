-- ========================================================================
-- CarDrive: Migration V2 - Marketplace Reservation Flow, Configurable Commission & Audit Events
-- Target: Supabase / PostgreSQL 15+
-- ========================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ------------------------------------------------------------------------
-- 1. Table: platform_settings (Commission configurable & paramètres globaux)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 15.00 CHECK (commission_rate >= 0 AND commission_rate <= 100),
    currency TEXT NOT NULL DEFAULT 'MAD',
    payment_fee NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    cancellation_fee NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insérer le réglage par défaut s'il n'existe pas encore
INSERT INTO public.platform_settings (commission_rate, currency)
SELECT 15.00, 'MAD'
WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings);

-- ------------------------------------------------------------------------
-- 2. Adaptations de la table public.bookings
-- ------------------------------------------------------------------------
-- Note: Si la table bookings existe déjà, nous ajoutons les nouvelles colonnes
DO $$
BEGIN
    -- Colonne reference (format CD-2026-XXXXXX)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'reference') THEN
        ALTER TABLE public.bookings ADD COLUMN reference TEXT UNIQUE;
        -- Remplir la référence pour les lignes existantes à partir de booking_ref si disponible
        UPDATE public.bookings SET reference = booking_ref WHERE reference IS NULL;
    END IF;

    -- Informations identité & permis client
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'first_name') THEN
        ALTER TABLE public.bookings ADD COLUMN first_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'last_name') THEN
        ALTER TABLE public.bookings ADD COLUMN last_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'cin') THEN
        ALTER TABLE public.bookings ADD COLUMN cin TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'customer_country') THEN
        ALTER TABLE public.bookings ADD COLUMN customer_country TEXT DEFAULT 'Maroc';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'birth_date') THEN
        ALTER TABLE public.bookings ADD COLUMN birth_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'license_number') THEN
        ALTER TABLE public.bookings ADD COLUMN license_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'license_expiry') THEN
        ALTER TABLE public.bookings ADD COLUMN license_expiry DATE;
    END IF;

    -- Options de location & livraison
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'delivery_type') THEN
        ALTER TABLE public.bookings ADD COLUMN delivery_type TEXT DEFAULT 'AIRPORT';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'flight_number') THEN
        ALTER TABLE public.bookings ADD COLUMN flight_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'flight_arrival_time') THEN
        ALTER TABLE public.bookings ADD COLUMN flight_arrival_time TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'child_seat') THEN
        ALTER TABLE public.bookings ADD COLUMN child_seat BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'additional_driver') THEN
        ALTER TABLE public.bookings ADD COLUMN additional_driver BOOLEAN DEFAULT false;
    END IF;

    -- Notes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'customer_notes') THEN
        ALTER TABLE public.bookings ADD COLUMN customer_notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'agency_notes') THEN
        ALTER TABLE public.bookings ADD COLUMN agency_notes TEXT;
    END IF;

    -- Statuts avancés
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'commission_status') THEN
        ALTER TABLE public.bookings ADD COLUMN commission_status TEXT DEFAULT 'PENDING';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'agency_status') THEN
        ALTER TABLE public.bookings ADD COLUMN agency_status TEXT DEFAULT 'PENDING';
    END IF;

    -- Horodatages du cycle de vie
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'requested_at') THEN
        ALTER TABLE public.bookings ADD COLUMN requested_at TIMESTAMPTZ DEFAULT now();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'reviewed_at') THEN
        ALTER TABLE public.bookings ADD COLUMN reviewed_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'confirmed_at') THEN
        ALTER TABLE public.bookings ADD COLUMN confirmed_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'completed_at') THEN
        ALTER TABLE public.bookings ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'cancelled_at') THEN
        ALTER TABLE public.bookings ADD COLUMN cancelled_at TIMESTAMPTZ;
    END IF;

    -- URL du document PDF
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'pdf_url') THEN
        ALTER TABLE public.bookings ADD COLUMN pdf_url TEXT;
    END IF;
END $$;

-- ------------------------------------------------------------------------
-- 3. Table: booking_events (Audit log & Timeline complète)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_role TEXT NOT NULL DEFAULT 'SYSTEM', -- 'CUSTOMER', 'AGENCY_OWNER', 'AGENCY_MANAGER', 'SUPER_ADMIN', 'SYSTEM'
    event_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour requêtes chronologiques d'une réservation
CREATE INDEX IF NOT EXISTS idx_booking_events_booking_id ON public.booking_events(booking_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(reference);
CREATE INDEX IF NOT EXISTS idx_bookings_status_dates ON public.bookings(status, start_date, end_date);

-- ------------------------------------------------------------------------
-- 4. RLS: Row-Level Security
-- ------------------------------------------------------------------------
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;

-- Platform Settings : Tout le monde peut lire la commission active, seuls les Admins peuvent la modifier
DROP POLICY IF EXISTS "Public can view platform settings" ON public.platform_settings;
CREATE POLICY "Public can view platform settings"
    ON public.platform_settings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Only admins can modify platform settings" ON public.platform_settings;
CREATE POLICY "Only admins can modify platform settings"
    ON public.platform_settings FOR ALL
    USING (public.is_admin());

-- Booking Events : Client voit les événements de sa réservation, Agence de ses réservations, Admin tout
DROP POLICY IF EXISTS "Booking events viewable by authorized participants" ON public.booking_events;
CREATE POLICY "Booking events viewable by authorized participants"
    ON public.booking_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = booking_events.booking_id
              AND (
                  b.customer_id = auth.uid()
                  OR public.is_agency_member(b.agency_id)
                  OR public.is_admin()
              )
        )
    );

DROP POLICY IF EXISTS "Authorized users can insert booking events" ON public.booking_events;
CREATE POLICY "Authorized users can insert booking events"
    ON public.booking_events FOR INSERT
    WITH CHECK (true);

-- ------------------------------------------------------------------------
-- 5. Sécurité Renforcée Bookings (Anti-Contournement & Anti-Désintermédiation)
-- ------------------------------------------------------------------------
-- Seuls les membres de l'agence affiliée, le client concerné ou le Super Admin
-- peuvent accéder aux dossiers de réservation.
DROP POLICY IF EXISTS "Bookings viewable by customer, agency or admin" ON public.bookings;
CREATE POLICY "Bookings viewable by customer, agency or admin"
    ON public.bookings FOR SELECT
    USING (
        (auth.uid() IS NOT NULL AND customer_id = auth.uid())
        OR public.is_agency_member(agency_id)
        OR public.is_admin()
    );

-- Seuls les gestionnaires de l'agence concernée ou les administrateurs CarDrive
-- peuvent modifier l'état ou le véhicule d'une réservation.
DROP POLICY IF EXISTS "Agencies and Admins can update booking status" ON public.bookings;
CREATE POLICY "Agencies and Admins can update booking status"
    ON public.bookings FOR UPDATE
    USING (
        public.is_agency_member(agency_id)
        OR public.is_admin()
    );

