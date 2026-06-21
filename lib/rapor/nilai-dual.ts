import { rataAngka } from "@/lib/e-rapor/nilai-akhir";

/** KI-3: rata-rata formatif + SAS (pengetahuan). */
export function hitungNilaiPengetahuan(
  nilaiFormatif: number | null,
  nilaiSas: number | null,
): number | null {
  const avg = rataAngka([nilaiFormatif, nilaiSas]);
  return avg != null ? Math.round(avg) : null;
}

/** KI-4: rata-rata sumatif STS + SAS (keterampilan). */
export function hitungNilaiKeterampilan(
  nilaiSumatifLm: number | null,
  nilaiSas: number | null,
): number | null {
  const avg = rataAngka([nilaiSumatifLm, nilaiSas]);
  return avg != null ? Math.round(avg) : null;
}

export function dualNilaiFromRapor(row: {
  nilai_pengetahuan?: number | null;
  nilai_keterampilan?: number | null;
  nilai_formatif?: number | null;
  nilai_sumatif_lm?: number | null;
  nilai_sas?: number | null;
  nilai_akhir?: number | null;
}): { pengetahuan: number | null; keterampilan: number | null } {
  const pengetahuan =
    row.nilai_pengetahuan != null
      ? Math.round(row.nilai_pengetahuan)
      : hitungNilaiPengetahuan(
          row.nilai_formatif ?? null,
          row.nilai_sas ?? null,
        );

  const keterampilan =
    row.nilai_keterampilan != null
      ? Math.round(row.nilai_keterampilan)
      : hitungNilaiKeterampilan(
          row.nilai_sumatif_lm ?? null,
          row.nilai_sas ?? null,
        );

  if (pengetahuan == null && keterampilan == null && row.nilai_akhir != null) {
    const fallback = Math.round(row.nilai_akhir);
    return { pengetahuan: fallback, keterampilan: fallback };
  }

  return { pengetahuan, keterampilan };
}
