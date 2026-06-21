-- =============================================================================
-- PERBAIKAN: jalankan ini di Supabase SQL Editor jika migrasi 024 gagal dengan:
--   ERROR 23514: violates check constraint "profiles_role_check"
-- =============================================================================
-- Penyebab: UPDATE role → 'user' dijalankan sebelum constraint lama di-drop.
-- =============================================================================

-- 1. Lepas constraint lama dulu
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_plan_check;

-- 2. Pastikan kolom baru ada
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS subscription_plan TEXT,
    ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- 3. Migrasi subscription (abaikan jika subscription_status sudah dihapus)
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

-- 4. Sekarang aman mengubah role
UPDATE public.profiles
SET role = 'user'
WHERE role IN ('editor', 'read-only')
   OR role IS NULL
   OR role NOT IN ('admin', 'user');

-- 5. Terapkan constraint baru
ALTER TABLE public.profiles
    ALTER COLUMN role SET DEFAULT 'user',
    ALTER COLUMN subscription_plan SET DEFAULT 'free',
    ALTER COLUMN subscription_plan SET NOT NULL;

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
        CHECK (role IN ('admin', 'user'));

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_subscription_plan_check
        CHECK (subscription_plan IN ('free', '1_month', '3_months', '1_year'));

-- 6. Hapus kolom lama
ALTER TABLE public.profiles DROP COLUMN IF EXISTS subscription_status;
