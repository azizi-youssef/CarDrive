-- ========================================================================
-- CarDrive: Enable Supabase Realtime Publication
-- Enables live WebSocket event broadcast for vehicles, bookings, agencies,
-- unavailabilities and reviews.
-- ========================================================================

DO $$
BEGIN
  -- 1. S'assurer que la publication standard supabase_realtime existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- 2. Ajouter les tables principales de CarDrive à la publication Realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
  EXCEPTION WHEN duplicate_object THEN
    -- La table est déjà dans la publication
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  EXCEPTION WHEN duplicate_object THEN
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agencies;
  EXCEPTION WHEN duplicate_object THEN
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_unavailability;
  EXCEPTION WHEN duplicate_object THEN
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
  EXCEPTION WHEN duplicate_object THEN
  END;
END $$;
