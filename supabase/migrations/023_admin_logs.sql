-- =============================================================================
-- Admin Dashboard — Riwayat aktivitas admin (admin_logs)
-- =============================================================================
-- Jalankan di Supabase SQL Editor setelah migrasi 021–022.
-- Bergantung pada: public.profiles, public.is_profile_admin()
-- =============================================================================

-- ── 1. Tabel admin_logs ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_logs (
    -- Primary key log
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Admin yang melakukan aksi (FK ke profiles.id = auth.users.id)
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,

    -- Jenis aksi, contoh: UPDATE_ROLE, UPDATE_SUBSCRIPTION, BULK_DELETE
    action_type TEXT NOT NULL
        CHECK (char_length(trim(action_type)) > 0),

    -- Detail aksi — simpan JSON terstruktur (target user, nilai lama/baru, dll.)
    details JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Waktu kejadian (timezone-aware)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.admin_logs IS
    'Audit trail aktivitas admin — siapa melakukan apa dan kapan.';
COMMENT ON COLUMN public.admin_logs.admin_id IS
    'UUID admin (profiles.id) yang mengeksekusi aksi.';
COMMENT ON COLUMN public.admin_logs.action_type IS
    'Kode aksi: UPDATE_ROLE, UPDATE_SUBSCRIPTION, BULK_DELETE, dll.';
COMMENT ON COLUMN public.admin_logs.details IS
    'Payload JSON: deskripsi, target_user_id, old_value, new_value, metadata.';

-- Index untuk filter riwayat di Admin Dashboard
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at
    ON public.admin_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id
    ON public.admin_logs(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_logs_action_type
    ON public.admin_logs(action_type);

CREATE INDEX IF NOT EXISTS idx_admin_logs_details_gin
    ON public.admin_logs USING GIN (details);

-- ── 2. Row Level Security (RLS) ─────────────────────────────────────────────

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_logs_select_admin ON public.admin_logs;
DROP POLICY IF EXISTS admin_logs_insert_admin ON public.admin_logs;

-- Policy SELECT: hanya admin yang boleh membaca riwayat
CREATE POLICY admin_logs_select_admin ON public.admin_logs
    FOR SELECT
    TO authenticated
    USING (public.is_profile_admin());

-- Policy INSERT: hanya admin; admin_id harus = user yang sedang login
CREATE POLICY admin_logs_insert_admin ON public.admin_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_profile_admin()
        AND admin_id = auth.uid()
    );

-- Tidak ada policy UPDATE/DELETE → log bersifat append-only (tidak bisa diubah/hapus via API)

-- ── 3. Grant akses dasar ────────────────────────────────────────────────────

GRANT SELECT, INSERT ON public.admin_logs TO authenticated;

-- =============================================================================
-- CONTOH INSERT (dari aplikasi / SQL Editor sebagai admin login)
-- =============================================================================
--
-- INSERT INTO public.admin_logs (admin_id, action_type, details)
-- VALUES (
--     auth.uid(),
--     'UPDATE_ROLE',
--     jsonb_build_object(
--         'description', 'Mengubah role pengguna',
--         'target_user_id', 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
--         'old_role', 'read-only',
--         'new_role', 'editor'
--     )
-- );
--
-- SELECT id, admin_id, action_type, details, created_at
-- FROM public.admin_logs
-- ORDER BY created_at DESC
-- LIMIT 50;
-- =============================================================================
