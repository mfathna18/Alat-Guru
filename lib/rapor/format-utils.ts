export function formatTanggalRapor(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function jkLabel(jk: string | null | undefined): string {
  if (jk === "L") return "Laki-laki";
  if (jk === "P") return "Perempuan";
  return "—";
}
