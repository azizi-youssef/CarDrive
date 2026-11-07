-- Correct the KlickDrive subscription pricing grid.
UPDATE public.subscription_plans
SET
  min_vehicles = CASE slug
    WHEN 'starter' THEN 5
    WHEN 'pro' THEN 15
    WHEN 'business' THEN 25
    WHEN 'unlimited' THEN 35
    ELSE min_vehicles
  END,
  max_vehicles = CASE slug
    WHEN 'starter' THEN 15
    WHEN 'pro' THEN 25
    WHEN 'business' THEN 35
    WHEN 'unlimited' THEN 45
    ELSE max_vehicles
  END,
  price_monthly = CASE slug
    WHEN 'starter' THEN 300
    WHEN 'pro' THEN 400
    WHEN 'business' THEN 500
    WHEN 'unlimited' THEN 600
    ELSE price_monthly
  END,
  updated_at = now()
WHERE slug IN ('starter', 'pro', 'business', 'unlimited');

-- Align all existing subscriptions with the corrected plan ranges.
WITH vehicle_counts AS (
  SELECT
    s.agency_id,
    COUNT(v.id)::integer AS vehicle_count
  FROM public.agency_subscriptions s
  LEFT JOIN public.vehicles v ON v.agency_id = s.agency_id
  GROUP BY s.agency_id
), desired_plans AS (
  SELECT
    counts.agency_id,
    plans.id AS plan_id,
    plans.price_monthly
  FROM vehicle_counts counts
  JOIN public.subscription_plans plans
    ON plans.slug = CASE
      WHEN counts.vehicle_count <= 15 THEN 'starter'
      WHEN counts.vehicle_count <= 25 THEN 'pro'
      WHEN counts.vehicle_count <= 35 THEN 'business'
      ELSE 'unlimited'
    END
)
UPDATE public.agency_subscriptions s
SET
  plan_id = desired.plan_id,
  price_paid = desired.price_monthly,
  updated_at = now()
FROM desired_plans desired
WHERE s.agency_id = desired.agency_id;
