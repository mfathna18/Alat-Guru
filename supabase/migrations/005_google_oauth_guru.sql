-- Google OAuth: ambil nama dari profil Google (full_name / name)
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.guru (auth_user_id, email, nama_guru)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'nama_guru',
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        )
    )
    ON CONFLICT (email) DO UPDATE
        SET auth_user_id = EXCLUDED.auth_user_id,
            nama_guru = COALESCE(
                NULLIF(guru.nama_guru, split_part(guru.email, '@', 1)),
                EXCLUDED.nama_guru
            );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
