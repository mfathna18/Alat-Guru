/** Ambil pesan error Supabase/PostgREST yang mudah dibaca pengguna. */
export function formatSupabaseError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message;
    if (msg.includes("id_mata_pelajaran") && msg.includes("schema cache")) {
      return "Database belum di-update. Jalankan migration 020_modul_per_mapel.sql di Supabase SQL Editor, lalu coba lagi.";
    }
    if (msg.includes("id_kelas") && msg.includes("schema cache")) {
      return "Database belum di-update. Jalankan migration 013_modul_per_kelas.sql di Supabase SQL Editor, lalu coba lagi.";
    }
    if (msg.includes("row-level security") || msg.includes("violates row-level security")) {
      return "Akses ditolak. Pastikan langganan aktif atau trial masih berlaku.";
    }
    if (msg.includes("duplicate key") || msg.includes("unique_modul")) {
      return "Urutan modul bentrok. Refresh halaman lalu coba lagi.";
    }
    return msg;
  }
  if (err && typeof err === "object" && "message" in err) {
    return formatSupabaseError(new Error(String((err as { message: unknown }).message)));
  }
  return "Terjadi kesalahan. Coba lagi.";
}
