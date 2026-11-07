BEGIN;

INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'klickdrive-agency-logos',
    'klickdrive-agency-logos',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can read KlickDrive agency logos" ON storage.objects;
CREATE POLICY "Public can read KlickDrive agency logos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'klickdrive-agency-logos');

COMMIT;
