-- ========================================================================
-- CarDrive: Migration V2.1 - Populate Missing Vehicle Images & Features
-- Apply to Supabase SQL Editor or psql
-- ========================================================================

-- 1. Ensure vehicle_images table has images for ALL vehicles that are missing them
-- Based on seed.sql IDs (v0000000-0000-0000-0000-XXXXXXXXXXXX format)

INSERT INTO public.vehicle_images (vehicle_id, url, is_primary, display_order)
SELECT v.id, 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80', true, 1
FROM public.vehicles v
WHERE v.id IN (
  'c0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000004',
  'c0000000-0000-0000-0000-000000000007',
  'c0000000-0000-0000-0000-000000000008'
)
AND NOT EXISTS (
  SELECT 1 FROM public.vehicle_images vi WHERE vi.vehicle_id = v.id
);

-- NOTE: If the live DB uses different UUID patterns, this script needs
-- to query by slug instead. Use the slug-based approach below.
INSERT INTO public.vehicle_images (vehicle_id, url, is_primary, display_order)
SELECT v.id,
  CASE
    WHEN v.category = 'Luxe' THEN 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80'
    WHEN v.category = 'SUV' THEN 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80'
    WHEN v.category = '7 places' THEN 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80'
    WHEN v.category = 'Berline' THEN 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&auto=format&fit=crop&q=80'
    ELSE 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80'
  END,
  true,
  1
FROM public.vehicles v
WHERE NOT EXISTS (
  SELECT 1 FROM public.vehicle_images vi WHERE vi.vehicle_id = v.id
);

-- 2. Populate missing vehicle features for all vehicles
INSERT INTO public.vehicle_features (vehicle_id, name)
SELECT v.id, 'Climatisation automatique'
FROM public.vehicles v
WHERE NOT EXISTS (
  SELECT 1 FROM public.vehicle_features vf WHERE vf.vehicle_id = v.id
);

INSERT INTO public.vehicle_features (vehicle_id, name)
SELECT v.id, 'Bluetooth mains-libres'
FROM public.vehicles v
WHERE NOT EXISTS (
  SELECT 1 FROM public.vehicle_features vf WHERE vf.vehicle_id = v.id AND vf.name = 'Bluetooth mains-libres'
);

INSERT INTO public.vehicle_features (vehicle_id, name)
SELECT v.id, 'Prise USB'
FROM public.vehicles v
WHERE NOT EXISTS (
  SELECT 1 FROM public.vehicle_features vf WHERE vf.vehicle_id = v.id AND vf.name = 'Prise USB'
);

-- Add feature based on transmission
INSERT INTO public.vehicle_features (vehicle_id, name)
SELECT v.id, 'Boite automatique'
FROM public.vehicles v
WHERE v.transmission = 'AUTOMATIC'
AND NOT EXISTS (
  SELECT 1 FROM public.vehicle_features vf WHERE vf.vehicle_id = v.id AND vf.name = 'Boite automatique'
);

-- 3. Platform settings - insert default if not exists
INSERT INTO public.platform_settings (commission_rate, currency)
SELECT 15.00, 'MAD'
WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings);

