-- =============================================================================
-- Admin Dashboard — Tabel public.profiles
-- =============================================================================
-- Profil pengguna terpusat untuk Admin Dashboard (role & langganan).
-- Berdampingan dengan tabel `guru` yang sudah ada — tidak menggantikannya.
-- Jalankan di Supabase SQL Editor setelah migrasi 001–020.
-- =============================================================================

-- ── 1. Tabel profiles ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
    -- Primary key = UUID dari Supabase Auth (auth.users.id)
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Timestamp pembaruan terakhir (timezone-aware)
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Data identitas dasar
    full_name TEXT,
    email TEXT,

    -- Hak akses Admin Dashboard
    role TEXT NOT NULL DEFAULT 'read-only'
        CHECK (role IN ('admin', 'editor', 'read-only')),

    -- Status langganan / paket
    subscription_status TEXT NOT NULL DEFAULT 'free'
        CHECK (subscription_status IN ('free', 'premium', 'vip'))
);

COMMENT ON TABLE public.profiles IS
    'Profil pengguna untuk Admin Dashboard — role & status langganan.';
COMMENT ON COLUMN public.profiles.role IS
    'admin = akses penuh semua profil; editor/read-only = terbatas (atur di aplikasi).';
COMMENT ON COLUMN public.profiles.subscription_status IS
    'Paket langganan: free, premium, vip.';

-- Index untuk filter admin & lookup email
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ── 2. Trigger: auto-update updated_at ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_profiles_updated_at();

-- ── 3. Otomatisasi sync auth.users → profiles ───────────────────────────────
-- Setiap user baru mendaftar, salin id, email, dan full_name ke profiles.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_full_name TEXT;
BEGIN
    -- Ambil nama dari metadata OAuth / form registrasi
    v_full_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'nama_guru'), ''),
        split_part(COALESCE(NEW.email, ''), '@', 1)
    );

    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, v_full_name)
    ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            full_name = COALESCE(
                NULLIF(EXCLUDED.full_name, ''),
                public.profiles.full_name
            );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user_profile();

-- Backfill: user Auth yang sudah ada sebelum migrasi ini dijalankan
INSERT INTO public.profiles (id, email, full_name)
SELECT
    u.id,
    u.email,
    COALESCE(
        NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''),
        NULLIF(TRIM(u.raw_user_meta_data->>'name'), ''),
        NULLIF(TRIM(u.raw_user_meta_data->>'nama_guru'), ''),
        split_part(COALESCE(u.email, ''), '@', 1)
    )
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- ── 4. Helper: cek apakah user login adalah admin ───────────────────────────

CREATE OR REPLACE FUNCTION public.is_profile_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    );
$$;

-- ── 5. Row Level Security (RLS) ───────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika migrasi dijalankan ulang
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_all ON public.profiles;

-- Policy A: user login hanya boleh SELECT profil dirinya sendiri
CREATE POLICY profiles_select_own ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Policy B: admin boleh ALL (SELECT, INSERT, UPDATE, DELETE) pada semua baris
CREATE POLICY profiles_admin_all ON public.profiles
    FOR ALL
    TO authenticated
    USING (public.is_profile_admin())
    WITH CHECK (public.is_profile_admin());

-- ── 6. Grant akses dasar (role authenticated Supabase) ────────────────────────

GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- =============================================================================
-- CATATAN SETELAH MIGRASI
-- =============================================================================
-- 1. Tetapkan admin pertama secara manual (ganti UUID/email Anda):
--
--    UPDATE public.profiles
--    SET role = 'admin'
--    WHERE email = 'admin@sekolah.id';
--
-- 2. Trigger `on_auth_user_created_profile` berjalan paralel dengan trigger
--    `on_auth_user_created` yang mengisi tabel `guru` — keduanya aman.
-- =============================================================================
