import type { SkorKualitatif } from "@/lib/types/database";

export function angkaKePredikat(nilai: number | null): SkorKualitatif | null {
  if (nilai == null) return null;
  if (nilai >= 90) return "SB";
  if (nilai >= 80) return "BSH";
  if (nilai >= 70) return "MB";
  return "BB";
}

export function predikatLabel(predikat: SkorKualitatif): string {
  const map: Record<SkorKualitatif, string> = {
    SB: "Sangat Baik",
    BSH: "Baik",
    MB: "Cukup",
    BB: "Perlu Bimbingan",
  };
  return map[predikat];
}

export function formatNilaiRapor(
  angka: number | null,
  predikat: SkorKualitatif | null,
  tampilkanAngka: boolean,
  tampilkanPredikat: boolean,
): string {
  const parts: string[] = [];
  if (tampilkanAngka && angka != null) {
    parts.push(String(Math.round(angka)));
  }
  if (tampilkanPredikat && predikat) {
    parts.push(`${predikat} (${predikatLabel(predikat)})`);
  }
  return parts.length > 0 ? parts.join(" · ") : "—";
}
