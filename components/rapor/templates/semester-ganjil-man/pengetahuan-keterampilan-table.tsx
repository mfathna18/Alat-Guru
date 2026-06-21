import type { MapelNilaiDualRow } from "@/lib/rapor/build-view-model";
import type { SemesterGanjilViewModel } from "@/lib/rapor/build-view-model";
import { KELOMPOK_SECTION_LABELS } from "@/lib/rapor/man-template-labels";
import type { MapelKelompok } from "@/lib/types/database";

function NilaiPredikatCells({
  nilai,
  predikat,
}: {
  nilai: number | null;
  predikat: string | null;
}) {
  return (
    <>
      <td className="text-center">{nilai ?? "—"}</td>
      <td className="text-center">{predikat ?? "—"}</td>
    </>
  );
}

function KelompokSection({
  kelompok,
  rows,
}: {
  kelompok: MapelKelompok;
  rows: MapelNilaiDualRow[];
}) {
  if (rows.length === 0) return null;

  let rowNo = 0;

  return (
    <>
      <tr className="section-row">
        <td colSpan={6}>{KELOMPOK_SECTION_LABELS[kelompok]}</td>
      </tr>
      {rows.map((row) => {
        if (row.isGroupHeader) {
          return (
            <tr key={row.id} className="italic-row">
              <td colSpan={6} className="text-left">
                {row.namaMapel}
              </td>
            </tr>
          );
        }

        const displayNo = row.subLabel ? "" : String(++rowNo);
        const displayName = row.subLabel
          ? `${row.subLabel}. ${row.namaMapel}`
          : row.namaMapel;

        return (
          <tr key={row.id}>
            <td className="text-center">{displayNo}</td>
            <td className="text-left">{displayName}</td>
            <NilaiPredikatCells
              nilai={row.pengetahuan.nilai}
              predikat={row.pengetahuan.predikat}
            />
            <NilaiPredikatCells
              nilai={row.keterampilan.nilai}
              predikat={row.keterampilan.predikat}
            />
          </tr>
        );
      })}
    </>
  );
}

interface PengetahuanKeterampilanTableProps {
  viewModel: SemesterGanjilViewModel;
}

export function PengetahuanKeterampilanTable({
  viewModel,
}: PengetahuanKeterampilanTableProps) {
  const {
    kkm,
    kelompokA,
    kelompokB,
    kelompokC,
    kelompokLintas,
    totalPengetahuan,
    totalKeterampilan,
  } = viewModel;

  const hasRows =
    kelompokA.length > 0 ||
    kelompokB.length > 0 ||
    kelompokC.length > 0 ||
    kelompokLintas.length > 0;

  return (
    <section className="rapor-man-section">
      <h3 className="rapor-man-section-title">B. Pengetahuan dan Keterampilan</h3>
      <p className="rapor-man-section-meta" style={{ marginBottom: 8 }}>
        Kriteria Ketuntasan Minimal: {kkm}{" "}
        <span style={{ textTransform: "lowercase" }}>(x)</span>
      </p>

      <div className="rapor-man-table-wrap">
        <table className="rapor-man-table">
          <colgroup>
            <col className="col-no" />
            <col className="col-mapel" />
            <col className="col-nilai" />
            <col className="col-predikat" />
            <col className="col-nilai" />
            <col className="col-predikat" />
          </colgroup>
        <thead>
          <tr>
            <th rowSpan={2}>No.</th>
            <th rowSpan={2} className="text-left">
              Mata Pelajaran
            </th>
            <th colSpan={2}>Pengetahuan</th>
            <th colSpan={2}>Keterampilan</th>
          </tr>
          <tr>
            <th>Nilai</th>
            <th>Predikat</th>
            <th>Nilai</th>
            <th>Predikat</th>
          </tr>
        </thead>
        <tbody>
          <KelompokSection kelompok="A" rows={kelompokA} />
          <KelompokSection kelompok="B" rows={kelompokB} />
          <KelompokSection kelompok="C" rows={kelompokC} />
          <KelompokSection kelompok="L" rows={kelompokLintas} />

          {!hasRows && (
            <tr className="empty-row">
              <td colSpan={6}>
                Belum ada data rapor. Simpan rekap mapel terlebih dahulu.
              </td>
            </tr>
          )}

          {hasRows && (
            <tr className="total-row">
              <td colSpan={2} className="text-left">
                Jumlah
              </td>
              <td className="text-center">{totalPengetahuan}</td>
              <td />
              <td className="text-center">{totalKeterampilan}</td>
              <td />
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </section>
  );
}
