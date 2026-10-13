-- ========================================================================
-- CarDrive: Agency Fleet, Availability Calendar & Rental Inspections
-- Migration: 20261012000300_agency_fleet_and_availability.sql
-- ========================================================================

-- 1. Additive columns to public.vehicles
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS included_mileage_km INTEGER DEFAULT 250,
ADD COLUMN IF NOT EXISTS extra_mileage_price NUMERIC(10, 2) DEFAULT 2.00,
ADD COLUMN IF NOT EXISTS min_driver_age INTEGER DEFAULT 21,
ADD COLUMN IF NOT EXISTS rental_conditions TEXT,
ADD COLUMN IF NOT EXISTS delivery_options JSONB DEFAULT '["AIRPORT", "AGENCY"]'::jsonb,
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_vehicles_agency_archived
ON public.vehicles(agency_id, archived_at)
WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_vehicles_status_published
ON public.vehicles(agency_id, status, published);

-- 2. Table: public.vehicle_unavailability (Blocages manuels & maintenance)
CREATE TABLE IF NOT EXISTS public.vehicle_unavailability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('MAINTENANCE', 'RESERVED_OFFLINE', 'ACCIDENT', 'CUSTOM', 'BLOCKED')),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_unavailability_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_unavail_vehicle_dates
ON public.vehicle_unavailability(vehicle_id, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_vehicle_unavail_agency
ON public.vehicle_unavailability(agency_id, start_date);

-- 3. Table: public.booking_inspections (Checklists & états des lieux départ/retour)
CREATE TABLE IF NOT EXISTS public.booking_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('PICKUP', 'RETURN')),
    inspected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    inspector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    mileage INTEGER NOT NULL,
    fuel_level TEXT NOT NULL CHECK (fuel_level IN ('EMPTY', '1/4', '1/2', '3/4', 'FULL')),
    exterior_condition JSONB DEFAULT '{"clean": true, "scratches": [], "damages": []}'::jsonb,
    interior_condition JSONB DEFAULT '{"clean": true, "damages": []}'::jsonb,
    checklist JSONB DEFAULT '{"spare_tire": true, "jack": true, "documents": true, "safety_triangle": true, "vest": true}'::jsonb,
    notes TEXT,
    signature_url TEXT,
    photos TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_inspections_booking
ON public.booking_inspections(booking_id, type);

CREATE INDEX IF NOT EXISTS idx_booking_inspections_agency
ON public.booking_inspections(agency_id, inspected_at DESC);

-- 4. Handover columns on public.bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS pickup_actual_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS return_actual_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pickup_mileage INTEGER,
ADD COLUMN IF NOT EXISTS return_mileage INTEGER,
ADD COLUMN IF NOT EXISTS pickup_fuel_level TEXT,
ADD COLUMN IF NOT EXISTS return_fuel_level TEXT,
ADD COLUMN IF NOT EXISTS deposit_returned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deposit_deduction NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS handover_notes TEXT;

-- 5. RLS Policies
ALTER TABLE public.vehicle_unavailability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_inspections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- vehicle_unavailability
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_unavailability' AND policyname = 'Agency members read unavailability') THEN
        CREATE POLICY "Agency members read unavailability"
        ON public.vehicle_unavailability FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.agency_members am
                WHERE am.agency_id = vehicle_unavailability.agency_id
                AND am.user_id = auth.uid()
                AND am.status = 'ACTIVE'
            )
            OR EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN', 'ADMIN')
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_unavailability' AND policyname = 'Agency members manage unavailability') THEN
        CREATE POLICY "Agency members manage unavailability"
        ON public.vehicle_unavailability FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.agency_members am
                WHERE am.agency_id = vehicle_unavailability.agency_id
                AND am.user_id = auth.uid()
                AND am.status = 'ACTIVE'
                AND am.role IN ('agency_admin', 'agency_manager', 'agency_agent')
            )
            OR EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN', 'ADMIN')
            )
        );
    END IF;

    -- booking_inspections
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'booking_inspections' AND policyname = 'Agency members read inspections') THEN
        CREATE POLICY "Agency members read inspections"
        ON public.booking_inspections FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.agency_members am
                WHERE am.agency_id = booking_inspections.agency_id
                AND am.user_id = auth.uid()
                AND am.status = 'ACTIVE'
            )
            OR EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN', 'ADMIN')
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'booking_inspections' AND policyname = 'Agency members manage inspections') THEN
        CREATE POLICY "Agency members manage inspections"
        ON public.booking_inspections FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.agency_members am
                WHERE am.agency_id = booking_inspections.agency_id
                AND am.user_id = auth.uid()
                AND am.status = 'ACTIVE'
                AND am.role IN ('agency_admin', 'agency_manager', 'agency_agent')
            )
            OR EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN', 'ADMIN')
            )
        );
    END IF;
END $$;
