-- =============================================================================
-- Auto full access saat registrasi — tanpa approval admin
-- =============================================================================
-- Menggantikan 026_remove_signup_trial: user baru langsung aktif 1 tahun.
-- Jalankan di Supabase SQL Editor setelah migrasi 001–027.
-- =============================================================================

-- ── 1. Profil: set langganan aktif saat auth user baru dibuat ────────────────

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_full_name TEXT;
    v_email TEXT;
    v_expires TIMESTAMPTZ := NOW() + INTERVAL '365 days';
BEGIN
    v_full_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'nama_guru'), ''),
        split_part(COALESCE(NEW.email, NEW.id::text), '@', 1)
    );

    v_email := COALESCE(
        NULLIF(TRIM(NEW.email), ''),
        NEW.id::text || '@oauth.local'
    );

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

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        subscription_plan,
        subscription_expires_at
    )
    VALUES (
        NEW.id,
        v_email,
        v_full_name,
        'user',
        '1_year',
        v_expires
    )
    ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            full_name = COALESCE(
                NULLIF(EXCLUDED.full_name, ''),
                public.profiles.full_name
            ),
            subscription_plan = COALESCE(
                public.profiles.subscription_plan,
                EXCLUDED.subscription_plan
            ),
            subscription_expires_at = COALESCE(
                public.profiles.subscription_expires_at,
                EXCLUDED.subscription_expires_at
            );

    RETURN NEW;
END;
$$;

-- ── 2. Subscriptions: status aktif 1 tahun (RLS guru_can_write) ────────────

CREATE OR REPLACE FUNCTION public.provision_guru_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    default_plan_id UUID;
    period_end TIMESTAMPTZ := NOW() + INTERVAL '365 days';
BEGIN
    SELECT id INTO default_plan_id
    FROM public.plans
    WHERE slug = 'premium-monthly'
    LIMIT 1;

    IF default_plan_id IS NULL THEN
        RETURN NEW;
    END IF;

    BEGIN
        INSERT INTO public.subscriptions (
            id_guru,
            plan_id,
            status,
            trial_ends_at,
            current_period_start,
            current_period_end,
            grace_ends_at
        )
        VALUES (
            NEW.id,
            default_plan_id,
            'active',
            NULL,
            NOW(),
            period_end,
            period_end + INTERVAL '1 day'
        )
        ON CONFLICT (id_guru) DO UPDATE
            SET status = EXCLUDED.status,
                trial_ends_at = NULL,
                current_period_start = COALESCE(
                    public.subscriptions.current_period_start,
                    EXCLUDED.current_period_start
                ),
                current_period_end = COALESCE(
                    public.subscriptions.current_period_end,
                    EXCLUDED.current_period_end
                ),
                grace_ends_at = COALESCE(
                    public.subscriptions.grace_ends_at,
                    EXCLUDED.grace_ends_at
                )
            WHERE public.subscriptions.status = 'expired'
              AND (
                  public.subscriptions.current_period_end IS NULL
                  OR public.subscriptions.current_period_end <= NOW()
              );
    EXCEPTION
        WHEN others THEN
            RAISE WARNING 'provision_guru_subscription gagal untuk guru %: %', NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$;

-- ── 3. Backfill: user non-admin tanpa akses aktif ───────────────────────────

UPDATE public.profiles
SET
    role = CASE WHEN role = 'admin' THEN 'admin' ELSE 'user' END,
    subscription_plan = '1_year',
    subscription_expires_at = NOW() + INTERVAL '365 days'
WHERE role IS DISTINCT FROM 'admin'
  AND (
      subscription_expires_at IS NULL
      OR subscription_expires_at <= NOW()
  );

UPDATE public.subscriptions s
SET
    status = 'active',
    trial_ends_at = NULL,
    current_period_start = COALESCE(s.current_period_start, NOW()),
    current_period_end = NOW() + INTERVAL '365 days',
    grace_ends_at = NOW() + INTERVAL '366 days'
FROM public.guru g
JOIN public.profiles p ON p.id = g.auth_user_id
WHERE s.id_guru = g.id
  AND p.role IS DISTINCT FROM 'admin'
  AND p.subscription_expires_at > NOW()
  AND (
      s.status = 'expired'
      OR s.current_period_end IS NULL
      OR s.current_period_end <= NOW()
  );

-- =============================================================================
-- SETELAH MIGRASI: user baru otomatis full access; user lama non-admin di-backfill.
-- =============================================================================
