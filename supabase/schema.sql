-- ========================================================================
-- CarDrive: PostgreSQL Schema with RLS, Temporal Availability & Multi-Agency
-- Target: Supabase / PostgreSQL 15+
-- ========================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- Required for range overlap constraints

-- ------------------------------------------------------------------------
-- 1. Profiles & RBAC
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'AGENCY_OWNER', 'AGENCY_MANAGER', 'AGENCY_STAFF', 'CUSTOMER')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------
-- 2. Agencies
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    phone TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Nador',
    latitude NUMERIC(10, 7) DEFAULT 35.1688,
    longitude NUMERIC(10, 7) DEFAULT -2.9335,
    logo_url TEXT,
    banner_url TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED')),
    verified BOOLEAN NOT NULL DEFAULT false,
    rating NUMERIC(3, 2) DEFAULT 4.90,
    review_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------
-- 3. Agency Members (RBAC Link)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agency_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'AGENCY_STAFF' CHECK (role IN ('AGENCY_OWNER', 'AGENCY_MANAGER', 'AGENCY_STAFF')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (agency_id, user_id)
);

-- ------------------------------------------------------------------------
-- 4. Vehicles (Physical Units)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    unit_number TEXT NOT NULL, -- e.g. "Duster #001"
    license_plate TEXT, -- e.g. "54231-A-50"
    brand TEXT NOT NULL, -- e.g. "Dacia"
    model TEXT NOT NULL, -- e.g. "Duster"
    slug TEXT NOT NULL UNIQUE,
    year INTEGER NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Économique', 'SUV', 'Berline', 'Luxe', '7 places', 'Automatique', 'Citadine', 'Compacte')),
    transmission TEXT NOT NULL CHECK (transmission IN ('MANUAL', 'AUTOMATIC')),
    fuel TEXT NOT NULL CHECK (fuel IN ('DIESEL', 'GASOLINE', 'HYBRID', 'ELECTRIC')),
    seats INTEGER NOT NULL DEFAULT 5,
    doors INTEGER NOT NULL DEFAULT 5,
    air_conditioning BOOLEAN NOT NULL DEFAULT true,
    mileage INTEGER DEFAULT 18500,
    daily_price NUMERIC(10, 2) NOT NULL CHECK (daily_price > 0),
    weekly_price NUMERIC(10, 2),
    monthly_price NUMERIC(10, 2),
    deposit NUMERIC(10, 2) NOT NULL DEFAULT 3000.00,
    min_rental_days INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'BLOCKED')),
    published BOOLEAN NOT NULL DEFAULT true,
    featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------
-- 5. Vehicle Images
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicle_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------
-- 6. Vehicle Features
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicle_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------
-- 7. Pricing Rules (Tiered / Seasonal)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    min_days INTEGER,
    max_days INTEGER,
    discount_percentage NUMERIC(5, 2) DEFAULT 0.00,
    custom_daily_price NUMERIC(10, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------
-- 8. Bookings (With Anti-Double-Booking range constraint & statuses)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_ref TEXT NOT NULL UNIQUE, -- e.g. "#NRD-8421"
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    rental_period daterange GENERATED ALWAYS AS (daterange(start_date, end_date, '[]')) STORED,
    pickup_time TEXT NOT NULL DEFAULT '10:00',
    dropoff_time TEXT NOT NULL DEFAULT '10:00',
    pickup_location TEXT NOT NULL DEFAULT 'Aéroport Nador Al-Aroui',
    dropoff_location TEXT NOT NULL DEFAULT 'Aéroport Nador Al-Aroui',
    total_days INTEGER NOT NULL CHECK (total_days > 0),
    daily_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    deposit_amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'ACTIVE', 'COMPLETED', 'NO_SHOW')),
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- Exclusion constraint to guarantee no overlapping CONFIRMED/ACTIVE bookings at DB level
-- Note: Cancelled or Rejected bookings are excluded.
ALTER TABLE public.bookings
ADD CONSTRAINT no_overlapping_confirmed_bookings
EXCLUDE USING gist (
    vehicle_id WITH =,
    rental_period WITH &&
)
WHERE (status IN ('CONFIRMED', 'ACTIVE'));

-- ------------------------------------------------------------------------
-- 9. Blocked & Maintenance Periods
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blocked_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    rental_period daterange GENERATED ALWAYS AS (daterange(start_date, end_date, '[]')) STORED,
    reason TEXT NOT NULL DEFAULT 'Bloqué par l''agence',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.maintenance_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    rental_period daterange GENERATED ALWAYS AS (daterange(start_date, end_date, '[]')) STORED,
    details TEXT NOT NULL DEFAULT 'Entretien technique / Révision',
    cost NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------
-- 10. Reviews & Ratings
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------
-- 11. Favorites & Notifications
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, vehicle_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'BOOKING' CHECK (type IN ('BOOKING', 'VERIFICATION', 'SYSTEM', 'PROMO')),
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------
-- 12. Audit Logs
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------
-- 13. INDEXES FOR HIGH-SPEED QUERYING (10k+ CATALOGUE SCALE)
-- ------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_vehicles_agency_id ON public.vehicles(agency_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand_model ON public.vehicles(brand, model);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON public.vehicles(category);
CREATE INDEX IF NOT EXISTS idx_vehicles_daily_price ON public.vehicles(daily_price);
CREATE INDEX IF NOT EXISTS idx_vehicles_status_published ON public.vehicles(status, published);
CREATE INDEX IF NOT EXISTS idx_agencies_slug ON public.agencies(slug);
CREATE INDEX IF NOT EXISTS idx_agencies_status_verified ON public.agencies(status, verified);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_dates ON public.bookings USING gist (vehicle_id, rental_period);
CREATE INDEX IF NOT EXISTS idx_bookings_agency_status ON public.bookings(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_vehicle_id ON public.reviews(vehicle_id);

-- ------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Is Super Admin or Admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Is member of agency?
CREATE OR REPLACE FUNCTION public.is_agency_member(target_agency_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.agency_members
        WHERE agency_id = target_agency_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can view & edit their own profile; Admins see all
CREATE POLICY "Profiles are readable by owner or admin"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles editable by owner or admin"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin());

-- Agencies: Public can see ACTIVE & VERIFIED agencies; agency members can see their own; Admins see all
CREATE POLICY "Public agencies are viewable by everyone"
    ON public.agencies FOR SELECT
    USING (status = 'ACTIVE' OR public.is_agency_member(id) OR public.is_admin());

CREATE POLICY "Agency owners and managers can update agency"
    ON public.agencies FOR UPDATE
    USING (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.agency_members
            WHERE agency_id = agencies.id AND user_id = auth.uid() AND role IN ('AGENCY_OWNER', 'AGENCY_MANAGER')
        )
    );

-- Vehicles: Published & Available vehicles are viewable by all; Agency members manage their own
CREATE POLICY "Public vehicles viewable by everyone"
    ON public.vehicles FOR SELECT
    USING (published = true OR public.is_agency_member(agency_id) OR public.is_admin());

CREATE POLICY "Agency members can modify their vehicles"
    ON public.vehicles FOR ALL
    USING (public.is_agency_member(agency_id) OR public.is_admin());

-- Bookings: Customer can view their own; Agency members can view and manage their agency's bookings; Admins view all
CREATE POLICY "Bookings viewable by customer, agency or admin"
    ON public.bookings FOR SELECT
    USING (customer_id = auth.uid() OR public.is_agency_member(agency_id) OR public.is_admin());

CREATE POLICY "Anyone can create a booking request"
    ON public.bookings FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Agencies and Admins can update booking status"
    ON public.bookings FOR UPDATE
    USING (public.is_agency_member(agency_id) OR public.is_admin());

-- ------------------------------------------------------------------------
-- 15. AVAILABILITY STORED FUNCTION (CORE ENGINE)
-- Checks if a vehicle is available for a given date range
-- ------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_vehicle_availability(
    target_vehicle_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
    has_conflict BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.bookings
        WHERE vehicle_id = target_vehicle_id
          AND status IN ('CONFIRMED', 'ACTIVE', 'PENDING')
          AND rental_period && daterange(p_start_date, p_end_date, '[]')
        UNION ALL
        SELECT 1 FROM public.blocked_periods
        WHERE vehicle_id = target_vehicle_id
          AND rental_period && daterange(p_start_date, p_end_date, '[]')
        UNION ALL
        SELECT 1 FROM public.maintenance_periods
        WHERE vehicle_id = target_vehicle_id
          AND rental_period && daterange(p_start_date, p_end_date, '[]')
    ) INTO has_conflict;

    RETURN NOT has_conflict;
END;
$$ LANGUAGE plpgsql STABLE;
