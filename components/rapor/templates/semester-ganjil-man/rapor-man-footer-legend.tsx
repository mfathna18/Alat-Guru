import type { SemesterGanjilViewModel } from "@/lib/rapor/build-view-model";

interface RaporPredicateLegendProps {
  ranges: SemesterGanjilViewModel["predicateRanges"];
  kkm: number;
}

export function RaporPredicateLegend({ ranges, kkm }: RaporPredicateLegendProps) {
  return (
    <section className="rapor-man-legend">
      <p className="rapor-man-legend-title">Tabel predikat:</p>
      <div className="rapor-man-table-wrap">
        <table className="rapor-man-table rapor-man-legend-table">
          <colgroup>
            <col className="col-legend" />
            <col className="col-legend" />
            <col className="col-legend" />
            <col className="col-legend" />
            <col className="col-legend" />
          </colgroup>
        <thead>
          <tr>
            <th>KKM</th>
            <th>D</th>
            <th>C</th>
            <th>B</th>
            <th>A</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="text-center">
              {kkm} <span style={{ textTransform: "lowercase" }}>(x)</span>
            </td>
            <td className="text-center">{ranges.D}</td>
            <td className="text-center">{ranges.C}</td>
            <td className="text-center">{ranges.B}</td>
            <td className="text-center">{ranges.A}</td>
          </tr>
        </tbody>
      </table>
      </div>
    </section>
  );
}

interface RaporManPageFooterProps {
  kelasNama: string;
  namaSiswa: string;
  nisn: string | null;
  pageNumber?: number;
}

export function RaporManPageFooter({
  kelasNama,
  namaSiswa,
  nisn,
  pageNumber = 1,
}: RaporManPageFooterProps) {
  return (
    <footer className="rapor-man-footer">
      <p className="rapor-man-footer-id">
        {kelasNama} _ {namaSiswa.toUpperCase()} _ {nisn ?? "—"}
      </p>
      <p className="rapor-man-footer-page">Halaman {pageNumber}</p>
    </footer>
  );
}
