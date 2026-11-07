BEGIN;

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
        COALESCE(
            NULLIF(LEFT(BTRIM(NEW.raw_user_meta_data->>'full_name'), 120), ''),
            NULLIF(LEFT(BTRIM(NEW.raw_user_meta_data->>'name'), 120), ''),
            ''
        ),
        'CUSTOMER'
    )
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

INSERT INTO public.profiles (id, email, full_name, role)
SELECT
    users.id,
    users.email,
    COALESCE(
        NULLIF(LEFT(BTRIM(users.raw_user_meta_data->>'full_name'), 120), ''),
        NULLIF(LEFT(BTRIM(users.raw_user_meta_data->>'name'), 120), ''),
        ''
    ),
    'CUSTOMER'
FROM auth.users AS users
WHERE users.email IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE profile.id = users.id
  )
  AND NOT EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE LOWER(profile.email) = LOWER(users.email)
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;
