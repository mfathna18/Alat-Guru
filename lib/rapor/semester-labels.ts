export function semesterLabel(semester: 1 | 2): "Ganjil" | "Genap" {
  return semester === 1 ? "Ganjil" : "Genap";
}

export function kelasSemesterLabel(
  namaKelas: string,
  semester: 1 | 2,
): string {
  return `${namaKelas} / ${semesterLabel(semester)}`;
}
