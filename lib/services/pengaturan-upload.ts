export const LOGO_SEKOLAH_BUCKET = "logo-sekolah";

export type PengaturanUploadKind = "logo" | "ttd-wali" | "ttd-kepsek";

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export function validatePengaturanImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw new Error("File harus berformat PNG, JPG, WEBP, atau GIF.");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Ukuran file maksimal 2 MB.");
  }
}

export function buildPengaturanStoragePath(
  guruId: number,
  kind: PengaturanUploadKind,
  fileName: string,
) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "png";
  const stamp = Date.now();
  const prefix =
    kind === "logo" ? "logo" : kind === "ttd-wali" ? "ttd-wali" : "ttd-kepsek";
  return `${guruId}/${prefix}-${stamp}.${ext}`;
}
