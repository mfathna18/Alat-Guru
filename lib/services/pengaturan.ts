import { createClient } from "@/lib/supabase/client";
import { fetchCurrentGuru } from "@/lib/services/kelas";
import {
  assertPengaturanPayload,
  buildPengaturanPayload,
  type PengaturanSekolahInput,
  validateTahunAjaran,
} from "@/lib/services/pengaturan-shared";
import type { PengaturanSekolah } from "@/lib/types/database";
import {
  DEFAULT_RAPOR_TEMPLATE_ID,
  parseRaporTemplateId,
  type RaporTemplateId,
} from "@/lib/rapor/types";
import { isMissingColumnError } from "@/lib/utils";

export type { PengaturanSekolahInput } from "@/lib/services/pengaturan-shared";
export { validateTahunAjaran };

export interface RaporPreferencesInput {
  rapor_template_id?: RaporTemplateId;
  rapor_watermark_logo?: boolean;
}

const LOGO_BUCKET = "logo-sekolah";

export type TtdUploadRole = "wali-kelas" | "kepsek";

function validateSignatureFile(file: File) {
  const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    throw new Error("Tanda tangan harus berformat PNG, JPG, WEBP, atau GIF.");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Ukuran tanda tangan maksimal 2 MB.");
  }
}

export async function fetchPengaturanSekolah(): Promise<PengaturanSekolah | null> {
  const guru = await fetchCurrentGuru();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("pengaturan_sekolah")
    .select("*")
    .eq("id_guru", guru.id)
    .maybeSingle();

  if (error) throw error;
  return (data as PengaturanSekolah | null) ?? null;
}

export async function savePengaturanSekolah(
  input: PengaturanSekolahInput,
): Promise<PengaturanSekolah> {
  const guru = await fetchCurrentGuru();
  const payload = buildPengaturanPayload(guru.id, input);
  assertPengaturanPayload(payload);

  const res = await fetch("/api/pengaturan/sekolah", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const body = (await res.json()) as {
    pengaturan?: PengaturanSekolah;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(body.error ?? "Gagal menyimpan pengaturan.");
  }

  if (!body.pengaturan) {
    throw new Error("Gagal menyimpan pengaturan.");
  }

  return body.pengaturan;
}

/** Simpan preferensi template & watermark E-Rapor tanpa form pengaturan penuh. */
export async function saveRaporPreferences(
  input: RaporPreferencesInput,
): Promise<PengaturanSekolah> {
  const existing = await fetchPengaturanSekolah();
  if (!existing) {
    throw new Error(
      "Lengkapi Pengaturan Sekolah terlebih dahulu sebelum menyimpan preferensi rapor.",
    );
  }

  const supabase = createClient();
  const payload: Record<string, unknown> = {};

  if (input.rapor_template_id != null) {
    payload.rapor_template_id = input.rapor_template_id;
  }
  if (input.rapor_watermark_logo != null) {
    payload.rapor_watermark_logo = input.rapor_watermark_logo;
  }

  if (Object.keys(payload).length === 0) {
    return existing;
  }

  let result = await supabase
    .from("pengaturan_sekolah")
    .update(payload)
    .eq("id", existing.id)
    .select()
    .single();

  if (result.error && isMissingColumnError(result.error)) {
    const slim = { ...payload };
    delete slim.rapor_template_id;
    if (Object.keys(slim).length === 0) {
      return existing;
    }
    result = await supabase
      .from("pengaturan_sekolah")
      .update(slim)
      .eq("id", existing.id)
      .select()
      .single();
  }

  if (result.error) throw result.error;

  const row = result.data as PengaturanSekolah;
  return {
    ...row,
    rapor_template_id: parseRaporTemplateId(
      row.rapor_template_id ?? DEFAULT_RAPOR_TEMPLATE_ID,
    ),
  };
}

export async function saveTtdSekolahUrl(
  role: TtdUploadRole,
  url: string | null,
): Promise<PengaturanSekolah> {
  const res = await fetch("/api/pengaturan/ttd", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, url }),
  });

  const body = (await res.json()) as {
    pengaturan?: PengaturanSekolah;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(body.error ?? "Gagal menyimpan tanda tangan.");
  }

  if (!body.pengaturan) {
    throw new Error("Gagal menyimpan tanda tangan.");
  }

  return body.pengaturan;
}

export async function uploadAndSaveTtdSekolah(
  file: File,
  guruId: number,
  role: TtdUploadRole,
): Promise<{ url: string; pengaturan: PengaturanSekolah }> {
  const url = await uploadTtdSekolah(file, guruId, role);
  const pengaturan = await saveTtdSekolahUrl(role, url);
  return { url, pengaturan };
}

export async function uploadLogoSekolah(
  file: File,
  guruId: number,
): Promise<string> {
  validateSignatureFile(file);

  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const path = `${guruId}/logo-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadTtdSekolah(
  file: File,
  guruId: number,
  role: TtdUploadRole,
): Promise<string> {
  validateSignatureFile(file);

  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const prefix = role === "wali-kelas" ? "ttd-wali" : "ttd-kepsek";
  const path = `${guruId}/${prefix}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function getDefaultTahunAjaran() {
  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  const start = month >= 6 ? year : year - 1;
  return `${start}/${start + 1}`;
}
