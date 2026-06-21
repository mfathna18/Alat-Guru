-- =============================================================================
-- Hapus trial 3 hari otomatis saat guru baru mendaftar
-- =============================================================================
-- Akun baru langsung status expired (tanpa trial_ends_at).
-- Akses penuh hanya setelah admin mengaktifkan paket di Manajemen User.
-- =============================================================================

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
            'expired',
            NULL,
            NULL,
            NULL,
            NULL
        )
        ON CONFLICT (id_guru) DO NOTHING;
    EXCEPTION
        WHEN others THEN
            RAISE WARNING 'provision_guru_subscription gagal untuk guru %: %', NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$;
