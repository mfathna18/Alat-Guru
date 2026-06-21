-- =============================================================================
-- guru_can_write — hormati profiles.subscription_expires_at (admin dashboard)
-- =============================================================================
-- Sebelumnya hanya membaca subscriptions.* sehingga admin grant paket di profiles
-- tidak membuka akses tulis (RLS tetap menolak INSERT/UPDATE).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.guru_can_write()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    g_id INT;
    g_trial TIMESTAMPTZ;
    sub RECORD;
    profile_expires TIMESTAMPTZ;
    now_ts TIMESTAMPTZ := NOW();
BEGIN
    -- Paket admin di profiles (subscription_expires_at)
    SELECT p.subscription_expires_at
    INTO profile_expires
    FROM public.profiles p
    WHERE p.id = auth.uid();

    IF profile_expires IS NOT NULL AND profile_expires > now_ts THEN
        RETURN TRUE;
    END IF;

    g_id := current_guru_id();
    IF g_id IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT trial_ends_at INTO g_trial FROM subscriptions WHERE id_guru = g_id;

    IF g_trial IS NOT NULL AND g_trial > now_ts THEN
        RETURN TRUE;
    END IF;

    SELECT * INTO sub FROM subscriptions WHERE id_guru = g_id;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    IF sub.status = 'trial' AND sub.trial_ends_at IS NOT NULL AND sub.trial_ends_at > now_ts THEN
        RETURN TRUE;
    END IF;

    IF sub.status IN ('active', 'grace') THEN
        IF sub.grace_ends_at IS NOT NULL AND now_ts <= sub.grace_ends_at THEN
            RETURN TRUE;
        END IF;
        IF sub.current_period_end IS NOT NULL AND now_ts <= sub.current_period_end THEN
            RETURN TRUE;
        END IF;
    END IF;

    RETURN FALSE;
END;
$$;
