import { createClient } from "@/lib/supabase/client";
import { fetchCurrentGuru } from "@/lib/services/kelas";
import {
  validatePengaturanImageFile,
  type PengaturanUploadKind,
} from "@/lib/services/pengaturan-upload";
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

export type TtdUploadRole = "wali-kelas" | "kepsek";

function ttdRoleToUploadKind(role: TtdUploadRole): PengaturanUploadKind {
  return role === "wali-kelas" ? "ttd-wali" : "ttd-kepsek";
}

async function uploadPengaturanAsset(
  file: File,
  kind: PengaturanUploadKind,
): Promise<string> {
  validatePengaturanImageFile(file);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("kind", kind);

  const res = await fetch("/api/pengaturan/upload", {
    method: "POST",
    body: formData,
  });

  const body = (await res.json()) as { url?: string; error?: string };

  if (!res.ok) {
    const message = body.error ?? "Gagal mengunggah file.";
    if (message.toLowerCase().includes("invalid api key")) {
      throw new Error(
        "Koneksi Supabase tidak valid di server production. Pastikan env Supabase di Vercel sudah benar lalu redeploy.",
      );
    }
    throw new Error(message);
  }

  if (!body.url) {
    throw new Error("Gagal mengunggah file.");
  }

  return body.url;
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
  _guruId: number,
): Promise<string> {
  return uploadPengaturanAsset(file, "logo");
}

export async function uploadTtdSekolah(
  file: File,
  _guruId: number,
  role: TtdUploadRole,
): Promise<string> {
  return uploadPengaturanAsset(file, ttdRoleToUploadKind(role));
}

export function getDefaultTahunAjaran() {
  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  const start = month >= 6 ? year : year - 1;
  return `${start}/${start + 1}`;
}
