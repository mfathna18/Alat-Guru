import { formatNilaiRapor, predikatLabel } from "@/lib/e-rapor/predikat";
import { RaporSignatureSlot } from "@/components/rapor/shared/rapor-signature-slot";
import { formatTanggalRapor, jkLabel } from "@/lib/rapor/format-utils";
import { getKopInstansiText } from "@/lib/rapor/kop-instansi";
import { RAPOR_KM_LAYOUT_CSS, RAPOR_KM_PRINT_MEDIA_CSS } from "@/lib/export/rapor/rapor-km-capture-css";
import { RAPOR_CONTENT_SCALE_CSS, RAPOR_PRINT_UNIT_CSS } from "@/lib/export/rapor/rapor-content-scale";
import { RaporPageShell } from "@/components/rapor/shared/rapor-page-shell";
import { RaporPrintUnit } from "@/components/rapor/shared/rapor-print-unit";
import type { RaporTemplateProps } from "@/lib/rapor/types";
import { siswaHasNis, siswaNisTrimmed } from "@/lib/siswa/siswa-nis";

export type RaporMapelRow =
  RaporTemplateProps["data"]["raporMapel"][number];

export function KmDefaultTemplate({ data, options }: RaporTemplateProps) {
  const {
    pengaturan,
    kelas,
    siswa,
    semester,
    tahunAjaran,
    raporMapel,
    kehadiran,
    ekstrakurikuler,
    eRapor,
  } = data;

  const tampilkanAngka = pengaturan?.rapor_tampilkan_angka ?? true;
  const tampilkanPredikat = pengaturan?.rapor_tampilkan_predikat ?? true;
  const namaSekolah = pengaturan?.nama_sekolah ?? "Nama Sekolah";
  const alamatSekolah = pengaturan?.alamat_sekolah ?? "";

  const mapelRows = raporMapel.map((row) => {
    const joined = row as RaporMapelRow & {
      mata_pelajaran?: { nama_mapel: string; kode_mapel: string | null } | null;
    };
    return {
      ...row,
      namaMapel: joined.mata_pelajaran?.nama_mapel ?? "Mata Pelajaran",
    };
  });

  return (
    <RaporPageShell
      watermarkLogo={options.watermarkLogo}
      logoUrl={pengaturan?.logo_url}
      printMode={options.printMode}
      printRoot={options.printRoot ?? true}
      className="rapor-km-doc"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `${RAPOR_KM_LAYOUT_CSS}\n${RAPOR_CONTENT_SCALE_CSS}\n${RAPOR_PRINT_UNIT_CSS}\n${RAPOR_KM_PRINT_MEDIA_CSS}`,
        }}
      />
      <RaporPrintUnit>
        <div className="rapor-km-body">
        <header className="rapor-km-header">
          {pengaturan?.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pengaturan.logo_url}
              alt=""
              crossOrigin="anonymous"
              className="rapor-km-header-logo"
            />
          )}
          <p className="rapor-km-header-sub">{getKopInstansiText(pengaturan)}</p>
          <h1 className="rapor-km-header-school">{namaSekolah}</h1>
          {alamatSekolah && (
            <p className="rapor-km-header-address">{alamatSekolah}</p>
          )}
          <h2 className="rapor-km-header-title">Laporan Hasil Belajar</h2>
          <p className="rapor-km-header-meta">
            Kurikulum Merdeka · Semester {semester} · TA {tahunAjaran}
          </p>
        </header>

        <section className="rapor-km-biodata">
          <p className="rapor-km-biodata-row">
            <span className="rapor-km-biodata-label">Nama</span>
            : {siswa.nama_siswa}
          </p>
          <p className="rapor-km-biodata-row">
            <span className="rapor-km-biodata-label">NISN</span>
            : {siswa.nisn ?? "—"}
          </p>
          <p className="rapor-km-biodata-row">
            <span className="rapor-km-biodata-label">Kelas</span>
            : {kelas.nama_kelas}
          </p>
          <p className="rapor-km-biodata-row">
            <span className="rapor-km-biodata-label">Jenis Kelamin</span>
            : {jkLabel(siswa.jenis_kelamin)}
          </p>
          <p className="rapor-km-biodata-row">
            <span className="rapor-km-biodata-label">Tempat, Tgl Lahir</span>
            : {siswa.tempat_lahir ?? "—"}
            {siswa.tanggal_lahir
              ? `, ${formatTanggalRapor(siswa.tanggal_lahir)}`
              : ""}
          </p>
          {siswaHasNis(siswa.nis) && (
            <p className="rapor-km-biodata-row">
              <span className="rapor-km-biodata-label">NIS</span>
              : {siswaNisTrimmed(siswa.nis)}
            </p>
          )}
          <p className="rapor-km-biodata-row rapor-km-biodata-full">
            <span className="rapor-km-biodata-label">Alamat</span>
            : {siswa.alamat ?? "—"}
          </p>
          <p className="rapor-km-biodata-row rapor-km-biodata-full">
            <span className="rapor-km-biodata-label">Nama Orang Tua</span>
            : Ayah {siswa.nama_ayah ?? "—"} / Ibu {siswa.nama_ibu ?? "—"}
          </p>
        </section>

        <section className="rapor-km-section">
          <h3 className="rapor-km-section-title">A. Sikap dan Capaian Pembelajaran</h3>
          <div className="rapor-km-table-wrap">
            <table className="rapor-km-table">
              <colgroup>
                <col className="col-no" />
                <col className="col-mapel" />
                <col className="col-nilai" />
                <col className="col-capaian" />
              </colgroup>
              <thead>
                <tr>
                  <th>No</th>
                  <th className="text-left">Mata Pelajaran</th>
                  <th>Nilai Akhir</th>
                  <th className="text-left">Capaian Kompetensi</th>
                </tr>
              </thead>
              <tbody>
                {mapelRows.length === 0 ? (
                  <tr className="empty-row">
                    <td colSpan={4}>
                      Belum ada data rapor. Simpan rekap mapel terlebih dahulu.
                    </td>
                  </tr>
                ) : (
                  mapelRows.map((row, i) => (
                    <tr key={row.id}>
                      <td className="text-center">{i + 1}</td>
                      <td className="text-left">{row.namaMapel}</td>
                      <td className="text-center">
                        {formatNilaiRapor(
                          row.nilai_akhir,
                          row.predikat_kualitatif,
                          tampilkanAngka,
                          tampilkanPredikat,
                        )}
                        {row.predikat_kualitatif && tampilkanPredikat && (
                          <span className="nilai-sub">
                            {predikatLabel(row.predikat_kualitatif)}
                          </span>
                        )}
                      </td>
                      <td className="capaian-cell text-left">
                        {row.deskripsi_capaian ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {kehadiran && (
          <section className="rapor-km-section">
            <h3 className="rapor-km-section-title">B. Ketidakhadiran</h3>
            <p className="rapor-km-text-block">
              Sakit: {kehadiran.sakit} hari · Izin: {kehadiran.izin} hari · Tanpa
              keterangan: {kehadiran.tanpa_keterangan} hari
            </p>
          </section>
        )}

        {ekstrakurikuler.length > 0 && (
          <section className="rapor-km-section">
            <h3 className="rapor-km-section-title">C. Ekstrakurikuler</h3>
            <div className="rapor-km-table-wrap">
              <table className="rapor-km-table">
                <colgroup>
                  <col className="col-no" />
                  <col className="col-mapel" />
                  <col className="col-nilai" />
                  <col className="col-capaian" />
                </colgroup>
                <thead>
                  <tr>
                    <th>No</th>
                    <th className="text-left">Kegiatan</th>
                    <th>Predikat</th>
                    <th className="text-left">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {ekstrakurikuler.map((ex, i) => (
                    <tr key={ex.id}>
                      <td className="text-center">{i + 1}</td>
                      <td className="text-left">{ex.nama_ekskul}</td>
                      <td className="text-center">
                        {ex.predikat_kualitatif ?? ex.predikat ?? "—"}
                      </td>
                      <td className="capaian-cell text-left">
                        {ex.deskripsi_capaian ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {eRapor?.catatan_wali_kelas && (
          <section className="rapor-km-section">
            <h3 className="rapor-km-section-title">Catatan Wali Kelas</h3>
            <p className="rapor-km-text-block">{eRapor.catatan_wali_kelas}</p>
          </section>
        )}

        <footer className="rapor-km-footer">
          <p className="rapor-km-date">
            {pengaturan?.kabupaten_kota ?? "…………………"},{" "}
            {formatTanggalRapor(
              eRapor?.tanggal_terbit ?? new Date().toISOString(),
            )}
          </p>
          <section className="rapor-km-signatures">
            <div className="rapor-km-signature-col">
              <p className="rapor-km-signature-role">Orang Tua/Wali</p>
              <span className="rapor-km-signature-gap" aria-hidden="true" />
              <p className="rapor-km-muted">(……………………………)</p>
            </div>
            <div className="rapor-km-signature-col">
              <p className="rapor-km-signature-role">Wali Kelas</p>
              <RaporSignatureSlot
                url={pengaturan?.ttd_wali_kelas_url}
                gapClassName="rapor-km-signature-gap"
              />
              <p>{pengaturan?.nama_wali_kelas ?? "(……………………………)"}</p>
              {pengaturan?.nip_wali_kelas && (
                <p className="rapor-km-muted">NIP. {pengaturan.nip_wali_kelas}</p>
              )}
            </div>
            <div className="rapor-km-signature-col">
              <p className="rapor-km-signature-role">Kepala Sekolah</p>
              <RaporSignatureSlot
                url={pengaturan?.ttd_kepsek_url}
                gapClassName="rapor-km-signature-gap"
              />
              <p>{pengaturan?.nama_kepsek ?? "(……………………………)"}</p>
              {pengaturan?.nip_kepsek && (
                <p className="rapor-km-muted">NIP. {pengaturan.nip_kepsek}</p>
              )}
            </div>
          </section>
        </footer>
        </div>
      </RaporPrintUnit>
    </RaporPageShell>
  );
}
