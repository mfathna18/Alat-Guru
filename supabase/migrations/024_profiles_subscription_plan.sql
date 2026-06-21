-- =============================================================================
-- Profiles — subscription_plan & subscription_expires_at
-- =============================================================================
-- Migrasi skema langganan dari subscription_status (free/premium/vip)
-- ke subscription_plan (free/1_month/3_months/1_year) + tanggal kedaluwarsa.
-- Role disederhanakan menjadi admin | user.
--
-- PENTING: constraint lama harus di-drop SEBELUM mengubah role ke 'user'.
-- =============================================================================

-- ── 1. Kolom baru ───────────────────────────────────────────────────────────

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS subscription_plan TEXT,
    ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- ── 2. Lepas constraint lama (agar nilai baru boleh ditulis) ────────────────

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_plan_check;

-- ── 3. Migrasi data lama (jika subscription_status masih ada) ───────────────

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'subscription_status'
    ) THEN
        UPDATE public.profiles
        SET subscription_plan = CASE subscription_status
            WHEN 'premium' THEN '1_month'
            WHEN 'vip' THEN '1_year'
            ELSE 'free'
        END
        WHERE subscription_plan IS NULL;

        UPDATE public.profiles
        SET subscription_expires_at = NOW() + INTERVAL '30 days'
        WHERE subscription_status = 'premium'
          AND subscription_expires_at IS NULL;

        UPDATE public.profiles
        SET subscription_expires_at = NOW() + INTERVAL '365 days'
        WHERE subscription_status = 'vip'
          AND subscription_expires_at IS NULL;
    END IF;
END $$;

UPDATE public.profiles
SET subscription_plan = COALESCE(subscription_plan, 'free')
WHERE subscription_plan IS NULL;

-- ── 4. Role: editor / read-only → user ──────────────────────────────────────

UPDATE public.profiles
SET role = 'user'
WHERE role IN ('editor', 'read-only');

-- Normalisasi nilai role tidak dikenal (selain admin) → user
UPDATE public.profiles
SET role = 'user'
WHERE role IS NULL OR role NOT IN ('admin', 'user');

-- ── 5. Constraint & default baru ────────────────────────────────────────────

ALTER TABLE public.profiles
    ALTER COLUMN role SET DEFAULT 'user',
    ALTER COLUMN subscription_plan SET DEFAULT 'free',
    ALTER COLUMN subscription_plan SET NOT NULL;

ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
        CHECK (role IN ('admin', 'user'));

ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_subscription_plan_check;
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_subscription_plan_check
        CHECK (subscription_plan IN ('free', '1_month', '3_months', '1_year'));

-- ── 6. Hapus kolom lama ─────────────────────────────────────────────────────

ALTER TABLE public.profiles DROP COLUMN IF EXISTS subscription_status;

COMMENT ON COLUMN public.profiles.subscription_plan IS
    'Paket langganan: free, 1_month, 3_months, 1_year.';
COMMENT ON COLUMN public.profiles.subscription_expires_at IS
    'Tanggal kedaluwarsa langganan (null = tidak aktif / gratis).';

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan
    ON public.profiles(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_expires_at
    ON public.profiles(subscription_expires_at);
