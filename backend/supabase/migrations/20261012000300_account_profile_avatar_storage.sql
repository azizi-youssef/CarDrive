BEGIN;

INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'klickdrive-profile-avatars',
    'klickdrive-profile-avatars',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can read KlickDrive profile avatars" ON storage.objects;
CREATE POLICY "Public can read KlickDrive profile avatars"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'klickdrive-profile-avatars');

COMMIT;
