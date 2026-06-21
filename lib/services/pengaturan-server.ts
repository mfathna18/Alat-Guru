import { createAdminClient } from "@/lib/supabase/admin";
import type { PengaturanSekolahInput } from "@/lib/services/pengaturan-shared";
import {
  assertPengaturanPayload,
  buildPengaturanPayload,
  slimOptionalPengaturanColumns,
  type PengaturanPayload,
} from "@/lib/services/pengaturan-shared";
import type { PengaturanSekolah } from "@/lib/types/database";
import {
  extractMissingColumnName,
  getErrorMessage,
  isMissingColumnError,
} from "@/lib/utils";

const OPTIONAL_PENGATURAN_COLUMNS = new Set([
  "kop_instansi",
  "nama_wali_kelas",
  "nip_wali_kelas",
  "ttd_wali_kelas_url",
  "ttd_kepsek_url",
  "jenjang",
]);

async function persistPengaturanPayload(
  existingId: number | null,
  payload: PengaturanPayload,
): Promise<PengaturanSekolah> {
  const admin = createAdminClient();
  let current: Record<string, unknown> = { ...payload };
  const maxAttempts = OPTIONAL_PENGATURAN_COLUMNS.size + 2;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const result = existingId
      ? await admin
          .from("pengaturan_sekolah")
          .update(current)
          .eq("id", existingId)
          .select()
          .single()
      : await admin
          .from("pengaturan_sekolah")
          .insert(current)
          .select()
          .single();

    if (!result.error) {
      return result.data as PengaturanSekolah;
    }

    if (!isMissingColumnError(result.error)) {
      throw new Error(
        getErrorMessage(result.error, "Gagal menyimpan pengaturan."),
      );
    }

    const missing = extractMissingColumnName(result.error);
    if (missing && missing in current) {
      delete current[missing];
      continue;
    }

    // Fallback terakhir jika nama kolom tidak ter-parse
    current = slimOptionalPengaturanColumns(payload) as Record<string, unknown>;
    const retry = existingId
      ? await admin
          .from("pengaturan_sekolah")
          .update(current)
          .eq("id", existingId)
          .select()
          .single()
      : await admin
          .from("pengaturan_sekolah")
          .insert(current)
          .select()
          .single();

    if (retry.error) {
      throw new Error(
        getErrorMessage(retry.error, "Gagal menyimpan pengaturan."),
      );
    }
    return retry.data as PengaturanSekolah;
  }

  throw new Error("Gagal menyimpan pengaturan setelah beberapa percobaan.");
}

/** Simpan pengaturan sekolah via service role — tidak terpengaruh cache schema client. */
export async function savePengaturanSekolahForGuru(
  guruId: number,
  input: PengaturanSekolahInput,
): Promise<PengaturanSekolah> {
  const payload = buildPengaturanPayload(guruId, input);
  assertPengaturanPayload(payload);

  const admin = createAdminClient();
  const { data: existing, error: existingErr } = await admin
    .from("pengaturan_sekolah")
    .select("id")
    .eq("id_guru", guruId)
    .maybeSingle();

  if (existingErr) throw existingErr;

  return persistPengaturanPayload(existing?.id ?? null, payload);
}
