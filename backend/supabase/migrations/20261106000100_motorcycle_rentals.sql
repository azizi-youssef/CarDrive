-- ========================================================================
-- CarDrive : location de motos par les agences partenaires
-- Migration : 20261106000100_motorcycle_rentals.sql
--
-- Additive et rétrocompatible :
--   - vehicles.vehicle_type ('CAR' par défaut : tous les véhicules existants restent des voitures) ;
--   - caractéristiques propres aux motos (cylindrée, permis exigé) ;
--   - catégories motos autorisées uniquement pour vehicle_type = 'MOTORCYCLE'.
-- Aucune donnée n'est créée ni modifiée. Les règles RLS existantes s'appliquent sans changement,
-- et une moto compte comme un véhicule dans le quota de l'abonnement de l'agence.
-- ========================================================================

BEGIN;

-- 1. Nouvelles colonnes
ALTER TABLE public.vehicles
    ADD COLUMN IF NOT EXISTS vehicle_type TEXT NOT NULL DEFAULT 'CAR',
    ADD COLUMN IF NOT EXISTS engine_cc INTEGER,
    ADD COLUMN IF NOT EXISTS license_required TEXT;

-- 2. Contraintes (recréées de façon idempotente)
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_vehicle_type_check;
ALTER TABLE public.vehicles
    ADD CONSTRAINT vehicles_vehicle_type_check
    CHECK (vehicle_type IN ('CAR', 'MOTORCYCLE'));

ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_engine_cc_check;
ALTER TABLE public.vehicles
    ADD CONSTRAINT vehicles_engine_cc_check
    CHECK (engine_cc IS NULL OR engine_cc BETWEEN 49 AND 2500);

ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_license_required_check;
ALTER TABLE public.vehicles
    ADD CONSTRAINT vehicles_license_required_check
    CHECK (license_required IS NULL OR license_required IN ('AM', 'A1', 'A2', 'A', 'B'));

-- Les champs moto ne concernent que les motos
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_motorcycle_fields_check;
ALTER TABLE public.vehicles
    ADD CONSTRAINT vehicles_motorcycle_fields_check
    CHECK (vehicle_type = 'MOTORCYCLE' OR (engine_cc IS NULL AND license_required IS NULL));

-- 3. Catégories : la contrainte d'origine (définie dans le CREATE TABLE, nom généré)
--    est remplacée par une contrainte nommée qui associe chaque catégorie à son type.
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'public'
          AND rel.relname = 'vehicles'
          AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) ILIKE '%category%'
    LOOP
        EXECUTE format('ALTER TABLE public.vehicles DROP CONSTRAINT %I', constraint_record.conname);
    END LOOP;
END $$;

ALTER TABLE public.vehicles
    ADD CONSTRAINT vehicles_category_check
    CHECK (
        (vehicle_type = 'CAR' AND category IN ('Économique', 'SUV', 'Berline', 'Luxe', '7 places', 'Automatique', 'Citadine', 'Compacte'))
        OR (vehicle_type = 'MOTORCYCLE' AND category IN ('Scooter', 'Roadster', 'Trail', 'Sportive', 'Custom'))
    );

-- 4. Index pour le filtre « Voitures / Motos » du catalogue
CREATE INDEX IF NOT EXISTS idx_vehicles_type_published
    ON public.vehicles(vehicle_type, published)
    WHERE archived_at IS NULL;

COMMENT ON COLUMN public.vehicles.vehicle_type IS 'Type de véhicule : CAR (voiture) ou MOTORCYCLE (moto).';
COMMENT ON COLUMN public.vehicles.engine_cc IS 'Cylindrée en cm³ (motos uniquement ; NULL pour une moto électrique ou non renseignée).';
COMMENT ON COLUMN public.vehicles.license_required IS 'Permis exigé par l''agence pour une moto : AM, A1, A2, A ou B.';

COMMIT;
