BEGIN;

ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS idempotency_key UUID,
    ADD COLUMN IF NOT EXISTS idempotency_fingerprint TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_idempotency_key
    ON public.bookings (idempotency_key)
    WHERE idempotency_key IS NOT NULL;

REVOKE ALL (idempotency_key, idempotency_fingerprint)
    ON TABLE public.bookings FROM PUBLIC, anon, authenticated;
GRANT SELECT (idempotency_key, idempotency_fingerprint),
      INSERT (idempotency_key, idempotency_fingerprint)
    ON TABLE public.bookings TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
