-- =============================================================================
-- Fix: "Database error saving new user" saat Login Google
-- =============================================================================
-- Penyebab umum:
--   1. Trigger profiles/guru diblokir RLS saat INSERT dari auth.users
--   2. Konflik UNIQUE auth_user_id / email di tabel guru
--   3. Trigger subscription gagal dan membatalkan seluruh signup
--
-- Jalankan SELURUH script ini di Supabase SQL Editor.
-- =============================================================================

-- ── 1. Gabungkan provisioning guru + profiles dalam satu function ───────────

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_full_name TEXT;
    v_email TEXT;
BEGIN
    v_full_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'nama_guru'), ''),
        split_part(COALESCE(NEW.email, NEW.id::text), '@', 1)
    );

    -- Google OAuth kadang belum punya email di metadata awal
    v_email := COALESCE(
        NULLIF(TRIM(NEW.email), ''),
        NEW.id::text || '@oauth.local'
    );

    -- ── Guru (Teacher's Dashboard) ───────────────────────────────────────────
    BEGIN
        INSERT INTO public.guru (auth_user_id, email, nama_guru)
        VALUES (NEW.id, v_email, v_full_name)
        ON CONFLICT (email) DO UPDATE
            SET auth_user_id = EXCLUDED.auth_user_id,
                nama_guru = COALESCE(
                    NULLIF(EXCLUDED.nama_guru, split_part(EXCLUDED.email, '@', 1)),
                    public.guru.nama_guru
                );
    EXCEPTION
        WHEN unique_violation THEN
            -- auth_user_id sudah terpakai baris lain → sinkronkan by auth_user_id
            UPDATE public.guru
            SET email = v_email,
                nama_guru = COALESCE(NULLIF(v_full_name, ''), public.guru.nama_guru)
            WHERE auth_user_id = NEW.id;

            IF NOT FOUND THEN
                UPDATE public.guru
                SET auth_user_id = NEW.id,
                    nama_guru = COALESCE(NULLIF(v_full_name, ''), public.guru.nama_guru)
                WHERE email = v_email;
            END IF;
    END;

    -- ── Profiles (Admin Dashboard) ─────────────────────────────────────────
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, v_email, v_full_name)
    ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            full_name = COALESCE(
                NULLIF(EXCLUDED.full_name, ''),
                public.profiles.full_name
            );

    RETURN NEW;
END;
$$;

-- Satu trigger saja — hapus trigger profiles terpisah (hindari race / double failure)
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();

-- ── 2. Subscription trial tidak boleh gagalkan signup ───────────────────────

CREATE OR REPLACE FUNCTION public.provision_guru_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    default_plan_id UUID;
BEGIN
    SELECT id INTO default_plan_id
    FROM public.plans
    WHERE slug = 'premium-monthly'
    LIMIT 1;

    IF default_plan_id IS NULL THEN
        RETURN NEW;
    END IF;

    BEGIN
        INSERT INTO public.subscriptions (id_guru, plan_id, status, trial_ends_at)
        VALUES (NEW.id, default_plan_id, 'trial', NOW() + INTERVAL '3 days')
        ON CONFLICT (id_guru) DO NOTHING;
    EXCEPTION
        WHEN others THEN
            -- Jangan batalkan pendaftaran user jika langganan gagal dibuat
            RAISE WARNING 'provision_guru_subscription gagal untuk guru %: %', NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$;

-- ── 3. Grant untuk role internal Supabase Auth ──────────────────────────────

GRANT USAGE ON SCHEMA public TO postgres, service_role;
GRANT INSERT, UPDATE, SELECT ON public.guru TO postgres, service_role;
GRANT INSERT, UPDATE, SELECT ON public.profiles TO postgres, service_role;
GRANT INSERT, SELECT ON public.subscriptions TO postgres, service_role;
GRANT SELECT ON public.plans TO postgres, service_role;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
        GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
        GRANT INSERT, UPDATE, SELECT ON public.guru TO supabase_auth_admin;
        GRANT INSERT, UPDATE, SELECT ON public.profiles TO supabase_auth_admin;
        GRANT INSERT, SELECT ON public.subscriptions TO supabase_auth_admin;
        GRANT SELECT ON public.plans TO supabase_auth_admin;
        GRANT EXECUTE ON FUNCTION public.handle_new_auth_user() TO supabase_auth_admin;
        GRANT EXECUTE ON FUNCTION public.provision_guru_subscription() TO supabase_auth_admin;
    END IF;
END $$;

-- ── 4. Policy RLS agar trigger/service bisa INSERT ────────────────────────────

DROP POLICY IF EXISTS guru_insert_service ON public.guru;
CREATE POLICY guru_insert_service ON public.guru
    FOR INSERT
    TO service_role
    WITH CHECK (true);

DROP POLICY IF EXISTS profiles_insert_service ON public.profiles;
CREATE POLICY profiles_insert_service ON public.profiles
    FOR INSERT
    TO service_role
    WITH CHECK (true);

DROP POLICY IF EXISTS subscriptions_insert_service ON public.subscriptions;
CREATE POLICY subscriptions_insert_service ON public.subscriptions
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- ── 5. Backfill user Auth yang signup-nya gagal sebelumnya ───────────────────

INSERT INTO public.profiles (id, email, full_name)
SELECT
    u.id,
    COALESCE(NULLIF(TRIM(u.email), ''), u.id::text || '@oauth.local'),
    COALESCE(
        NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''),
        NULLIF(TRIM(u.raw_user_meta_data->>'name'), ''),
        NULLIF(TRIM(u.raw_user_meta_data->>'nama_guru'), ''),
        split_part(COALESCE(u.email, u.id::text), '@', 1)
    )
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

INSERT INTO public.guru (auth_user_id, email, nama_guru)
SELECT
    u.id,
    COALESCE(NULLIF(TRIM(u.email), ''), u.id::text || '@oauth.local'),
    COALESCE(
        NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''),
        NULLIF(TRIM(u.raw_user_meta_data->>'name'), ''),
        NULLIF(TRIM(u.raw_user_meta_data->>'nama_guru'), ''),
        split_part(COALESCE(u.email, u.id::text), '@', 1)
    )
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.guru g WHERE g.auth_user_id = u.id
)
ON CONFLICT (email) DO UPDATE
    SET auth_user_id = EXCLUDED.auth_user_id;

-- =============================================================================
-- SETELAH MIGRASI
-- =============================================================================
-- 1. Coba login Google lagi di http://localhost:3000/login
-- 2. Jika masih gagal, cek log: Supabase Dashboard → Logs → Postgres
-- 3. Opsional — bersihkan user Auth gagal: Authentication → Users → hapus entry
--    yang statusnya error, lalu coba daftar ulang
-- =============================================================================
