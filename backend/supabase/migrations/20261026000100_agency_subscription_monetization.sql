-- ========================================================================
-- CarDrive: Monetization Model Transition
-- From Percentage Commission (15%) -> Monthly Subscription by Fleet Capacity
-- Target: Supabase / PostgreSQL 15+
-- ========================================================================

-- 1. Table: subscription_plans (Paliers de capacité de véhicules)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    min_vehicles INTEGER NOT NULL DEFAULT 1,
    max_vehicles INTEGER, -- NULL = Illimité
    price_monthly NUMERIC(10, 2) NOT NULL, -- en MAD
    currency TEXT NOT NULL DEFAULT 'MAD',
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    badge TEXT,
    is_popular BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table: agency_subscriptions (Abonnements actifs des concessions)
CREATE TABLE IF NOT EXISTS public.agency_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED')),
    custom_vehicle_limit INTEGER, -- Surcharge personnalisée éventuelle
    billing_cycle_start DATE NOT NULL DEFAULT CURRENT_DATE,
    billing_cycle_end DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
    price_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
    auto_renew BOOLEAN NOT NULL DEFAULT true,
    payment_method TEXT NOT NULL DEFAULT 'VIREMENT',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_agency_subscription UNIQUE (agency_id)
);

-- 3. Mise à jour de la table platform_settings pour refléter le modèle
ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS monetization_model TEXT NOT NULL DEFAULT 'SUBSCRIPTION';

-- Mettre à jour le taux de commission par défaut à 0.00% (les agences gardent 100% des réservations)
UPDATE public.platform_settings
SET commission_rate = 0.00,
    monetization_model = 'SUBSCRIPTION',
    updated_at = now()
WHERE id IS NOT NULL;

-- 4. Insertion des 4 paliers d'abonnement standards par capacité de flotte
INSERT INTO public.subscription_plans (
    name, slug, min_vehicles, max_vehicles, price_monthly, currency, badge, is_popular, sort_order, features
) VALUES
(
    'Starter',
    'starter',
    1,
    5,
    490.00,
    'MAD',
    'Petite agence',
    false,
    1,
    '[
        "Jusqu''à 5 véhicules actifs au catalogue",
        "0% de commission sur vos réservations directes",
        "100% des revenus locatifs reversés à l''agence",
        "Gestion du planning et calendrier en temps réel",
        "Support technique standard par WhatsApp"
    ]'::jsonb
),
(
    'Pro',
    'pro',
    6,
    15,
    990.00,
    'MAD',
    'Recommandé',
    true,
    2,
    '[
        "Jusqu''à 15 véhicules actifs au catalogue",
        "0% de commission sur toutes les réservations",
        "Mise en avant prioritaire dans les résultats CarDrive",
        "Statistiques de performance et tableaux de bord financiers",
        "Multi-comptes agents & gestionnaires",
        "Support prioritaire 7j/7"
    ]'::jsonb
),
(
    'Flotte Business',
    'business',
    16,
    30,
    1790.00,
    'MAD',
    'Grande flotte',
    false,
    3,
    '[
        "Jusqu''à 30 véhicules actifs au catalogue",
        "0% de commission sur toutes les réservations",
        "Badge Concessionnaire Officiel Vérifié",
        "Exports comptables et récapitulatifs automatisés",
        "Gestionnaire de compte CarDrive attitré",
        "Alertes WhatsApp immédiates pour toute nouvelle demande"
    ]'::jsonb
),
(
    'Concession Illimitée',
    'unlimited',
    31,
    NULL,
    2990.00,
    'MAD',
    'Sur-mesure',
    false,
    4,
    '[
        "Capacité en véhicules 100% ILLIMITÉE",
        "0% de commission sur toutes les réservations",
        "Multi-agences & succursales régionales",
        "Accès API & intégration flotte ERP sur-mesure",
        "Visibilité marketplace maximale garantie",
        "Ligne directe assistance VIP 24/7"
    ]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    min_vehicles = EXCLUDED.min_vehicles,
    max_vehicles = EXCLUDED.max_vehicles,
    price_monthly = EXCLUDED.price_monthly,
    badge = EXCLUDED.badge,
    is_popular = EXCLUDED.is_popular,
    sort_order = EXCLUDED.sort_order,
    features = EXCLUDED.features,
    updated_at = now();

-- 5. Attribution automatique d'un abonnement initial aux agences existantes
-- Basé sur leur nombre de véhicules actuels
DO $$
DECLARE
    rec RECORD;
    v_vehicle_count INTEGER;
    v_plan_id UUID;
    v_price NUMERIC(10, 2);
BEGIN
    FOR rec IN SELECT id, name FROM public.agencies LOOP
        -- Compter les véhicules actuels de l'agence
        SELECT COUNT(*) INTO v_vehicle_count FROM public.vehicles WHERE agency_id = rec.id;

        -- Déterminer le palier correspondant
        IF v_vehicle_count <= 5 THEN
            SELECT id, price_monthly INTO v_plan_id, v_price FROM public.subscription_plans WHERE slug = 'starter';
        ELSIF v_vehicle_count <= 15 THEN
            SELECT id, price_monthly INTO v_plan_id, v_price FROM public.subscription_plans WHERE slug = 'pro';
        ELSIF v_vehicle_count <= 30 THEN
            SELECT id, price_monthly INTO v_plan_id, v_price FROM public.subscription_plans WHERE slug = 'business';
        ELSE
            SELECT id, price_monthly INTO v_plan_id, v_price FROM public.subscription_plans WHERE slug = 'unlimited';
        END IF;

        -- Insérer l'abonnement initial
        INSERT INTO public.agency_subscriptions (
            agency_id,
            plan_id,
            status,
            price_paid,
            billing_cycle_start,
            billing_cycle_end,
            auto_renew,
            payment_method,
            notes
        ) VALUES (
            rec.id,
            v_plan_id,
            'ACTIVE',
            v_price,
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '1 month',
            true,
            'VIREMENT',
            'Initialisation automatique migration modèle abonnement par capacité'
        )
        ON CONFLICT (agency_id) DO NOTHING;
    END LOOP;
END;
$$;

-- 6. Politiques RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_subscriptions ENABLE ROW LEVEL SECURITY;

-- Plans visibles par tous (public & authentifié)
DROP POLICY IF EXISTS "Public can view active subscription plans" ON public.subscription_plans;
CREATE POLICY "Public can view active subscription plans"
    ON public.subscription_plans FOR SELECT
    USING (is_active = true);

-- Super Admins gèrent les plans
DROP POLICY IF EXISTS "Admins can manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Admins can manage subscription plans"
    ON public.subscription_plans FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('SUPER_ADMIN', 'ADMIN')
        )
    );

-- Les agences peuvent consulter leur propre abonnement
DROP POLICY IF EXISTS "Agencies can view own subscription" ON public.agency_subscriptions;
CREATE POLICY "Agencies can view own subscription"
    ON public.agency_subscriptions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.agency_members
            WHERE agency_members.user_id = auth.uid()
              AND agency_members.agency_id = agency_subscriptions.agency_id
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('SUPER_ADMIN', 'ADMIN')
        )
    );

-- Super Admins gèrent tous les abonnements
DROP POLICY IF EXISTS "Admins can manage agency subscriptions" ON public.agency_subscriptions;
CREATE POLICY "Admins can manage agency subscriptions"
    ON public.agency_subscriptions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('SUPER_ADMIN', 'ADMIN')
        )
    );
