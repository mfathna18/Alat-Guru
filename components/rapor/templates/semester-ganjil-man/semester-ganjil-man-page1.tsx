import { RaporSignatureSlot } from "@/components/rapor/shared/rapor-signature-slot";
import { formatTanggalRapor } from "@/lib/rapor/format-utils";
import { semesterLabel } from "@/lib/rapor/semester-labels";
import { RaporPageShell } from "@/components/rapor/shared/rapor-page-shell";
import {
  RaporBiodataStrip,
  RaporSekolahHeader,
} from "@/components/rapor/templates/semester-ganjil-man/rapor-man-header";
import {
  readSikapDeskripsi,
  SIKAP_DESKRIPSI_PLACEHOLDER,
} from "@/lib/rapor/sikap-deskripsi";
import type { RaporTemplateProps } from "@/lib/rapor/types";

export function SemesterGanjilManPage1({
  data,
  options,
}: Pick<RaporTemplateProps, "data" | "options">) {
  const { pengaturan, kehadiran, ekstrakurikuler, eRapor, semester, tahunAjaran } =
    data;

  const sikapDeskripsi =
    readSikapDeskripsi(eRapor) || SIKAP_DESKRIPSI_PLACEHOLDER;

  return (
    <RaporPageShell
      printRoot={false}
      watermarkLogo={options.watermarkLogo}
      logoUrl={pengaturan?.logo_url}
      printMode={options.printMode}
      className="rapor-man-page"
    >
      <div className="rapor-man-page-body">
        <RaporSekolahHeader data={data} />
        <RaporBiodataStrip data={data} />

        <section className="rapor-man-section">
          <h2 className="rapor-man-section-title">Laporan Hasil Belajar</h2>
          <p className="rapor-man-section-meta">
            Semester {semesterLabel(semester)} · Tahun Pelajaran {tahunAjaran}
          </p>
        </section>

        <section className="rapor-man-section">
          <h3 className="rapor-man-section-title">A. Sikap Spiritual dan Sosial</h3>
          <p className="rapor-man-paragraph">{sikapDeskripsi}</p>
        </section>

        {kehadiran && (
          <section className="rapor-man-section">
            <h3 className="rapor-man-section-heading">Ketidakhadiran</h3>
            <div className="rapor-man-table-wrap">
              <table className="rapor-man-table">
                <colgroup>
                  <col className="col-third" />
                  <col className="col-third" />
                  <col className="col-third" />
                </colgroup>
              <thead>
                <tr>
                  <th>Sakit</th>
                  <th>Izin</th>
                  <th>Tanpa Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-center">{kehadiran.sakit} hari</td>
                  <td className="text-center">{kehadiran.izin} hari</td>
                  <td className="text-center">{kehadiran.tanpa_keterangan} hari</td>
                </tr>
              </tbody>
            </table>
            </div>
          </section>
        )}

        {ekstrakurikuler.length > 0 && (
          <section className="rapor-man-section">
            <h3 className="rapor-man-section-heading">Ekstrakurikuler</h3>
            <div className="rapor-man-table-wrap">
              <table className="rapor-man-table">
                <colgroup>
                  <col className="col-no" />
                  <col className="col-kegiatan" />
                  <col className="col-predikat-sm" />
                  <col className="col-ket" />
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
                    <td className="text-left">{ex.deskripsi_capaian ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </section>
        )}
        {eRapor?.catatan_wali_kelas && (
          <section className="rapor-man-section">
            <h3 className="rapor-man-section-heading">Catatan Wali Kelas</h3>
            <p className="rapor-man-paragraph">{eRapor.catatan_wali_kelas}</p>
          </section>
        )}

        <p className="rapor-man-date">
          {pengaturan?.kabupaten_kota ?? "…………………"},{" "}
          {formatTanggalRapor(eRapor?.tanggal_terbit ?? new Date().toISOString())}
        </p>

        <section className="rapor-man-signatures">
          <div>
            <p>Orang Tua/Wali</p>
            <span className="rapor-man-signature-gap" aria-hidden="true" />
            <p className="rapor-man-muted">(……………………………)</p>
          </div>
          <div>
            <p>Wali Kelas</p>
            <RaporSignatureSlot
              url={pengaturan?.ttd_wali_kelas_url}
              gapClassName="rapor-man-signature-gap"
            />
            <p>{pengaturan?.nama_wali_kelas ?? "(……………………………)"}</p>
            {pengaturan?.nip_wali_kelas && (
              <p className="rapor-man-muted">NIP. {pengaturan.nip_wali_kelas}</p>
            )}
          </div>
          <div>
            <p>Kepala Sekolah</p>
            <RaporSignatureSlot
              url={pengaturan?.ttd_kepsek_url}
              gapClassName="rapor-man-signature-gap"
            />
            <p>{pengaturan?.nama_kepsek ?? "(……………………………)"}</p>
            {pengaturan?.nip_kepsek && (
              <p className="rapor-man-muted">NIP. {pengaturan.nip_kepsek}</p>
            )}
          </div>
        </section>
      </div>
    </RaporPageShell>
  );
}
