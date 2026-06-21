import type { ERaporPreviewData } from "@/lib/services/e-rapor";
import { kelasSemesterLabel } from "@/lib/rapor/semester-labels";
import { siswaHasNis, siswaNisTrimmed } from "@/lib/siswa/siswa-nis";

/** Kop sekolah — jenjang, nama sekolah, logo opsional (tanpa logo Kemenag). */
export function RaporSekolahHeader({
  data,
  showLogo = true,
}: {
  data: ERaporPreviewData;
  showLogo?: boolean;
}) {
  const { pengaturan } = data;
  const jenjang = data.kelas.jenjang ?? pengaturan?.jenjang ?? "Jenjang Sekolah";
  const namaSekolah = pengaturan?.nama_sekolah ?? "Nama Sekolah";

  return (
    <header className="rapor-man-header">
      {showLogo && pengaturan?.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pengaturan.logo_url}
          alt=""
          crossOrigin="anonymous"
          className="rapor-man-header-logo"
        />
      ) : null}
      <p className="rapor-man-header-line">{jenjang}</p>
      <p className="rapor-man-header-line">{namaSekolah}</p>
    </header>
  );
}

interface RaporBiodataStripProps {
  data: ERaporPreviewData;
}

export function RaporBiodataStrip({ data }: RaporBiodataStripProps) {
  const { siswa, kelas, semester, tahunAjaran, pengaturan } = data;

  const left = [
    { label: "Nama", value: siswa.nama_siswa },
    ...(siswaHasNis(siswa.nis)
      ? [{ label: "NIS", value: siswaNisTrimmed(siswa.nis)! }]
      : []),
    { label: "NISN", value: siswa.nisn ?? "—" },
  ];
  const right = [
    { label: "Sekolah", value: pengaturan?.nama_sekolah ?? "—" },
    {
      label: "Kelas/Semester",
      value: kelasSemesterLabel(kelas.nama_kelas, semester),
    },
    { label: "Tahun Pembelajaran", value: tahunAjaran },
  ];

  return (
    <section className="rapor-man-biodata">
      <div>
        {left.map(({ label, value }) => (
          <p key={label} className="rapor-man-biodata-row">
            <span className="rapor-man-biodata-label">{label}</span>
            {" : "}
            {value}
          </p>
        ))}
      </div>
      <div>
        {right.map(({ label, value }) => (
          <p key={label} className="rapor-man-biodata-row">
            <span className="rapor-man-biodata-label">{label}</span>
            {" : "}
            {value}
          </p>
        ))}
      </div>
    </section>
  );
}
