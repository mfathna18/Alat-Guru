import { getLoginUrl, getSiteOrigin } from "@/lib/auth/site-url";

const AUTH_ERRORS: Record<string, string> = {
  "Invalid login credentials":
    "Email atau kata sandi salah. Periksa kembali kredensial Anda.",
  "Email not confirmed":
    "Email belum dikonfirmasi. Cek inbox atau nonaktifkan konfirmasi email di Supabase Dashboard → Authentication → Providers → Email.",
  "User already registered": "Email sudah terdaftar. Silakan masuk.",
  "Password should be at least 6 characters":
    "Kata sandi minimal 6 karakter.",
  "Failed to fetch":
    "Koneksi ke Supabase gagal. Pastikan dev server jalan, internet aktif, dan .env.local benar — lalu restart dengan npm run dev.",
  "NetworkError when attempting to fetch resource.":
    "Koneksi jaringan gagal. Periksa internet atau status project Supabase (Dashboard → apakah project paused?).",
  "Load failed":
    "Koneksi ke server gagal. Jalankan ulang aplikasi dengan npm run dev.",
  "OAuth provider not enabled":
    "Login Google belum diaktifkan. Aktifkan provider Google di Supabase Dashboard → Authentication → Providers.",
  "Unsupported provider":
    "Provider login tidak didukung. Hubungkan Google di Supabase Dashboard.",
};

function googleSessionExpiredMessage(): string {
  return `Sesi login Google kedaluwarsa. Tutup tab lain, buka ${getLoginUrl()} lalu coba masuk lagi.`;
}

function connectionFailedMessage(): string {
  const origin = getSiteOrigin();
  if (origin.includes("localhost")) {
    return "Koneksi gagal. Pastikan npm run dev sedang berjalan dan buka http://localhost:3000 (bukan preview offline).";
  }
  return `Koneksi gagal. Periksa koneksi internet dan buka ${origin}/login.`;
}

export function translateAuthError(message: string) {
  if (message.toLowerCase().includes("connection failed")) {
    return connectionFailedMessage();
  }

  if (
    message ===
      "invalid request: both auth code and code verifier should be non-empty" ||
    message === "Invalid flow state, no valid flow state found"
  ) {
    return googleSessionExpiredMessage();
  }

  return AUTH_ERRORS[message] ?? message;
}

export function googleRedirectMismatchMessage(): string {
  const origin = getSiteOrigin();
  return `Redirect URI tidak cocok. Tambahkan ${origin}/auth/callback dan ${origin}/** di Supabase → Authentication → URL Configuration → Redirect URLs.`;
}

export function googleFlowStateExpiredMessage(): string {
  const login = getLoginUrl();
  const hint =
    getSiteOrigin().includes("localhost")
      ? " (bukan 127.0.0.1)"
      : "";
  return `Sesi login Google kedaluwarsa. Tutup tab lain, buka ${login}${hint}, lalu coba lagi.`;
}
