export interface TpCapaianRef {
  id: number;
  kode_tp: string;
  deskripsi_tp: string;
  rata: number;
}

export function generateDeskripsiCapaian(
  tertinggi: TpCapaianRef | null,
  terendah: TpCapaianRef | null,
  namaMapel: string,
): string {
  if (!tertinggi && !terendah) {
    return `Belum ada data penilaian sumatif yang cukup untuk ${namaMapel}.`;
  }

  if (tertinggi && terendah && tertinggi.id === terendah.id) {
    const capaian = lowercaseFirst(tertinggi.deskripsi_tp);
    return `Menunjukkan capaian baik dan konsisten dalam ${capaian}.`;
  }

  const parts: string[] = [];

  if (tertinggi) {
    parts.push(
      `Sangat baik dalam ${lowercaseFirst(tertinggi.deskripsi_tp)}`,
    );
  }

  if (terendah && (!tertinggi || terendah.id !== tertinggi.id)) {
    parts.push(
      `namun perlu bimbingan dalam ${lowercaseFirst(terendah.deskripsi_tp)}`,
    );
  }

  return `${parts.join(", ")}.`;
}

function lowercaseFirst(text: string): string {
  const t = text.trim();
  if (!t) return t;
  return t.charAt(0).toLowerCase() + t.slice(1);
}
