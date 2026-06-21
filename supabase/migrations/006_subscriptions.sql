-- Subscription & Billing (Midtrans) — Trial 3 hari, grace 1 hari
-- =============================================================================

-- Paket langganan
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_idr INT NOT NULL CHECK (price_idr > 0),
    promo_price_idr INT CHECK (promo_price_idr > 0),
    promo_label VARCHAR(100),
    interval_days INT NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Langganan per guru (satu baris aktif per guru)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_guru INT NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'trial'
        CHECK (status IN ('trial', 'active', 'grace', 'expired', 'cancelled')),
    trial_ends_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    grace_ends_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_subscription_per_guru UNIQUE (id_guru)
);

-- Pembayaran / transaksi gateway
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_guru INT NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    gateway VARCHAR(30) NOT NULL DEFAULT 'midtrans',
    gateway_order_id VARCHAR(100) NOT NULL UNIQUE,
    gateway_transaction_id VARCHAR(100),
    amount_idr INT NOT NULL CHECK (amount_idr > 0),
    original_price_idr INT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'refunded')),
    payment_method VARCHAR(50),
    snap_token TEXT,
    gateway_response JSONB,
    paid_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_guru ON subscriptions(id_guru);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_payments_guru ON payments(id_guru);
CREATE INDEX idx_payments_order ON payments(gateway_order_id);
CREATE INDEX idx_payments_status ON payments(status);

CREATE TRIGGER trg_subscriptions_updated
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_payments_updated
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Paket default: Premium Bulanan Rp 30.000 (promo Rp 20.000)
INSERT INTO plans (
    slug, name, description, price_idr, promo_price_idr, promo_label, interval_days, sort_order
) VALUES (
    'premium-monthly',
    'Premium Bulanan',
    'Akses penuh Teacher''s Dashboard — kelas, siswa, absensi, penilaian, PDF, dan alat kelas.',
    30000,
    20000,
    'Promo bulan ini',
    30,
    1
);

-- =============================================================================
-- Helper: apakah guru boleh menulis data (bukan read-only)
-- =============================================================================
CREATE OR REPLACE FUNCTION guru_can_write()
RETURNS BOOLEAN AS $$
DECLARE
    g_id INT;
    g_trial TIMESTAMPTZ;
    sub RECORD;
    now_ts TIMESTAMPTZ := NOW();
BEGIN
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================================================
-- Provision trial 3 hari saat guru baru dibuat
-- =============================================================================
CREATE OR REPLACE FUNCTION provision_guru_subscription()
RETURNS TRIGGER AS $$
DECLARE
    default_plan_id UUID;
BEGIN
    SELECT id INTO default_plan_id FROM plans WHERE slug = 'premium-monthly' LIMIT 1;

    IF default_plan_id IS NOT NULL THEN
        INSERT INTO subscriptions (id_guru, plan_id, status, trial_ends_at)
        VALUES (NEW.id, default_plan_id, 'trial', NOW() + INTERVAL '3 days')
        ON CONFLICT (id_guru) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_guru_provision_subscription
    AFTER INSERT ON guru
    FOR EACH ROW EXECUTE FUNCTION provision_guru_subscription();

-- Backfill subscription trial untuk guru yang sudah ada
INSERT INTO subscriptions (id_guru, plan_id, status, trial_ends_at)
SELECT g.id, p.id, 'trial', NOW() + INTERVAL '3 days'
FROM guru g
CROSS JOIN plans p
WHERE p.slug = 'premium-monthly'
ON CONFLICT (id_guru) DO NOTHING;

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY plans_read_all ON plans
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY subscriptions_own ON subscriptions
    FOR SELECT USING (id_guru = current_guru_id());

CREATE POLICY payments_own_select ON payments
    FOR SELECT USING (id_guru = current_guru_id());

CREATE POLICY payments_insert_own ON payments
    FOR INSERT WITH CHECK (id_guru = current_guru_id());

-- Tambah write guard: ganti policy ALL menjadi SELECT + write terpisah
DROP POLICY IF EXISTS kelas_all_own ON kelas;
CREATE POLICY kelas_select_own ON kelas
    FOR SELECT USING (id_guru = current_guru_id());
CREATE POLICY kelas_insert_own ON kelas
    FOR INSERT WITH CHECK (id_guru = current_guru_id() AND guru_can_write());
CREATE POLICY kelas_update_own ON kelas
    FOR UPDATE USING (id_guru = current_guru_id() AND guru_can_write());
CREATE POLICY kelas_delete_own ON kelas
    FOR DELETE USING (id_guru = current_guru_id() AND guru_can_write());

DROP POLICY IF EXISTS siswa_all_own ON siswa;
CREATE POLICY siswa_select_own ON siswa
    FOR SELECT USING (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
    );
CREATE POLICY siswa_insert_own ON siswa
    FOR INSERT WITH CHECK (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id()) AND guru_can_write()
    );
CREATE POLICY siswa_update_own ON siswa
    FOR UPDATE USING (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id()) AND guru_can_write()
    );
CREATE POLICY siswa_delete_own ON siswa
    FOR DELETE USING (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id()) AND guru_can_write()
    );

DROP POLICY IF EXISTS tp_all_own ON tujuan_pembelajaran;
CREATE POLICY tp_select_own ON tujuan_pembelajaran
    FOR SELECT USING (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
    );
CREATE POLICY tp_insert_own ON tujuan_pembelajaran
    FOR INSERT WITH CHECK (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id()) AND guru_can_write()
    );
CREATE POLICY tp_update_own ON tujuan_pembelajaran
    FOR UPDATE USING (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id()) AND guru_can_write()
    );
CREATE POLICY tp_delete_own ON tujuan_pembelajaran
    FOR DELETE USING (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id()) AND guru_can_write()
    );

DROP POLICY IF EXISTS indikator_all_own ON indikator;
CREATE POLICY indikator_select_own ON indikator
    FOR SELECT USING (
        id_tp IN (
            SELECT tp.id FROM tujuan_pembelajaran tp
            JOIN kelas k ON k.id = tp.id_kelas
            WHERE k.id_guru = current_guru_id()
        )
    );
CREATE POLICY indikator_write_own ON indikator
    FOR INSERT WITH CHECK (
        id_tp IN (
            SELECT tp.id FROM tujuan_pembelajaran tp
            JOIN kelas k ON k.id = tp.id_kelas
            WHERE k.id_guru = current_guru_id()
        ) AND guru_can_write()
    );
CREATE POLICY indikator_update_own ON indikator
    FOR UPDATE USING (
        id_tp IN (
            SELECT tp.id FROM tujuan_pembelajaran tp
            JOIN kelas k ON k.id = tp.id_kelas
            WHERE k.id_guru = current_guru_id()
        ) AND guru_can_write()
    );
CREATE POLICY indikator_delete_own ON indikator
    FOR DELETE USING (
        id_tp IN (
            SELECT tp.id FROM tujuan_pembelajaran tp
            JOIN kelas k ON k.id = tp.id_kelas
            WHERE k.id_guru = current_guru_id()
        ) AND guru_can_write()
    );

DROP POLICY IF EXISTS rubrik_all_own ON rubrik;
CREATE POLICY rubrik_select_own ON rubrik
    FOR SELECT USING (
        id_tp IN (
            SELECT tp.id FROM tujuan_pembelajaran tp
            JOIN kelas k ON k.id = tp.id_kelas
            WHERE k.id_guru = current_guru_id()
        )
    );
CREATE POLICY rubrik_insert_own ON rubrik
    FOR INSERT WITH CHECK (
        id_tp IN (
            SELECT tp.id FROM tujuan_pembelajaran tp
            JOIN kelas k ON k.id = tp.id_kelas
            WHERE k.id_guru = current_guru_id()
        ) AND guru_can_write()
    );
CREATE POLICY rubrik_update_own ON rubrik
    FOR UPDATE USING (
        id_tp IN (
            SELECT tp.id FROM tujuan_pembelajaran tp
            JOIN kelas k ON k.id = tp.id_kelas
            WHERE k.id_guru = current_guru_id()
        ) AND guru_can_write()
    );
CREATE POLICY rubrik_delete_own ON rubrik
    FOR DELETE USING (
        id_tp IN (
            SELECT tp.id FROM tujuan_pembelajaran tp
            JOIN kelas k ON k.id = tp.id_kelas
            WHERE k.id_guru = current_guru_id()
        ) AND guru_can_write()
    );

DROP POLICY IF EXISTS nilai_all_own ON nilai;
CREATE POLICY nilai_select_own ON nilai
    FOR SELECT USING (
        id_siswa IN (
            SELECT s.id FROM siswa s
            JOIN kelas k ON k.id = s.id_kelas
            WHERE k.id_guru = current_guru_id()
        )
    );
CREATE POLICY nilai_insert_own ON nilai
    FOR INSERT WITH CHECK (
        id_siswa IN (
            SELECT s.id FROM siswa s
            JOIN kelas k ON k.id = s.id_kelas
            WHERE k.id_guru = current_guru_id()
        ) AND guru_can_write()
    );
CREATE POLICY nilai_update_own ON nilai
    FOR UPDATE USING (
        id_siswa IN (
            SELECT s.id FROM siswa s
            JOIN kelas k ON k.id = s.id_kelas
            WHERE k.id_guru = current_guru_id()
        ) AND guru_can_write()
    );
CREATE POLICY nilai_delete_own ON nilai
    FOR DELETE USING (
        id_siswa IN (
            SELECT s.id FROM siswa s
            JOIN kelas k ON k.id = s.id_kelas
            WHERE k.id_guru = current_guru_id()
        ) AND guru_can_write()
    );

DROP POLICY IF EXISTS pengaturan_all_own ON pengaturan_sekolah;
CREATE POLICY pengaturan_select_own ON pengaturan_sekolah
    FOR SELECT USING (id_guru = current_guru_id());
CREATE POLICY pengaturan_insert_own ON pengaturan_sekolah
    FOR INSERT WITH CHECK (id_guru = current_guru_id() AND guru_can_write());
CREATE POLICY pengaturan_update_own ON pengaturan_sekolah
    FOR UPDATE USING (id_guru = current_guru_id() AND guru_can_write());
CREATE POLICY pengaturan_delete_own ON pengaturan_sekolah
    FOR DELETE USING (id_guru = current_guru_id() AND guru_can_write());

DROP POLICY IF EXISTS absensi_all_own ON absensi;
CREATE POLICY absensi_select_own ON absensi
    FOR SELECT USING (
        id_siswa IN (
            SELECT s.id FROM siswa s
            JOIN kelas k ON k.id = s.id_kelas
            WHERE k.id_guru = current_guru_id()
        )
    );
CREATE POLICY absensi_insert_own ON absensi
    FOR INSERT WITH CHECK (
        id_siswa IN (
            SELECT s.id FROM siswa s
            JOIN kelas k ON k.id = s.id_kelas
            WHERE k.id_guru = current_guru_id()
        ) AND guru_can_write()
    );
CREATE POLICY absensi_update_own ON absensi
    FOR UPDATE USING (
        id_siswa IN (
            SELECT s.id FROM siswa s
            JOIN kelas k ON k.id = s.id_kelas
            WHERE k.id_guru = current_guru_id()
        ) AND guru_can_write()
    );
CREATE POLICY absensi_delete_own ON absensi
    FOR DELETE USING (
        id_siswa IN (
            SELECT s.id FROM siswa s
            JOIN kelas k ON k.id = s.id_kelas
            WHERE k.id_guru = current_guru_id()
        ) AND guru_can_write()
    );

DROP POLICY IF EXISTS modul_ajar_all_own ON modul_ajar;
CREATE POLICY modul_ajar_select_own ON modul_ajar
    FOR SELECT USING (id_guru = current_guru_id());
CREATE POLICY modul_ajar_insert_own ON modul_ajar
    FOR INSERT WITH CHECK (id_guru = current_guru_id() AND guru_can_write());
CREATE POLICY modul_ajar_update_own ON modul_ajar
    FOR UPDATE USING (id_guru = current_guru_id() AND guru_can_write());
CREATE POLICY modul_ajar_delete_own ON modul_ajar
    FOR DELETE USING (id_guru = current_guru_id() AND guru_can_write());

DROP POLICY IF EXISTS kelas_modul_progress_all_own ON kelas_modul_progress;
CREATE POLICY kmp_select_own ON kelas_modul_progress
    FOR SELECT USING (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
    );
CREATE POLICY kmp_insert_own ON kelas_modul_progress
    FOR INSERT WITH CHECK (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id()) AND guru_can_write()
    );
CREATE POLICY kmp_update_own ON kelas_modul_progress
    FOR UPDATE USING (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id()) AND guru_can_write()
    );
CREATE POLICY kmp_delete_own ON kelas_modul_progress
    FOR DELETE USING (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id()) AND guru_can_write()
    );
