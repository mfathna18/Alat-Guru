-- =============================================================================
-- Statistik Penggunaan Fitur — event tracking per navigasi menu
-- =============================================================================
-- Jalankan di Supabase SQL Editor setelah migrasi 021–026.
-- Bergantung pada: public.profiles, public.is_profile_admin()
-- =============================================================================

-- ── 1. Tabel event ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.feature_usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    id_guru UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    feature_id TEXT NOT NULL
        CHECK (char_length(trim(feature_id)) > 0),

    menu TEXT NOT NULL
        CHECK (char_length(trim(menu)) > 0),

    path TEXT NOT NULL
        CHECK (char_length(trim(path)) > 0),

    category TEXT NOT NULL DEFAULT 'Umum'
        CHECK (char_length(trim(category)) > 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.feature_usage_events IS
    'Log navigasi menu/fitur guru — dipakai untuk statistik penggunaan admin.';

CREATE INDEX IF NOT EXISTS idx_feature_usage_events_created_at
    ON public.feature_usage_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feature_usage_events_feature_id
    ON public.feature_usage_events(feature_id);

CREATE INDEX IF NOT EXISTS idx_feature_usage_events_id_guru
    ON public.feature_usage_events(id_guru);

CREATE INDEX IF NOT EXISTS idx_feature_usage_events_feature_created
    ON public.feature_usage_events(feature_id, created_at DESC);

-- ── 2. Row Level Security ────────────────────────────────────────────────────

ALTER TABLE public.feature_usage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feature_usage_events_insert_own ON public.feature_usage_events;
DROP POLICY IF EXISTS feature_usage_events_select_admin ON public.feature_usage_events;

-- Guru hanya boleh insert event milik sendiri
CREATE POLICY feature_usage_events_insert_own ON public.feature_usage_events
    FOR INSERT
    TO authenticated
    WITH CHECK (id_guru = auth.uid());

-- Hanya admin yang boleh membaca semua event
CREATE POLICY feature_usage_events_select_admin ON public.feature_usage_events
    FOR SELECT
    TO authenticated
    USING (public.is_profile_admin());

-- ── 3. Agregasi untuk dashboard admin ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_feature_usage_aggregates()
RETURNS TABLE (
    feature_id TEXT,
    clicks_today BIGINT,
    clicks_week BIGINT,
    clicks_total BIGINT,
    unique_users_today BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    start_of_day TIMESTAMPTZ;
BEGIN
    IF NOT public.is_profile_admin() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    start_of_day := date_trunc(
        'day',
        (NOW() AT TIME ZONE 'Asia/Jakarta')
    ) AT TIME ZONE 'Asia/Jakarta';

    RETURN QUERY
    SELECT
        e.feature_id,
        COUNT(*) FILTER (WHERE e.created_at >= start_of_day)::BIGINT AS clicks_today,
        COUNT(*) FILTER (WHERE e.created_at >= NOW() - INTERVAL '7 days')::BIGINT AS clicks_week,
        COUNT(*)::BIGINT AS clicks_total,
        COUNT(DISTINCT e.id_guru) FILTER (
            WHERE e.created_at >= start_of_day
        )::BIGINT AS unique_users_today
    FROM public.feature_usage_events e
    GROUP BY e.feature_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_feature_usage_aggregates() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_feature_usage_aggregates() TO authenticated;
