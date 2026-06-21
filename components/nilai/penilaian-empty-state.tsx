"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { skalaLabel } from "@/lib/nilai/skala-label";
import type { PenilaianWorkspace } from "@/lib/services/penilaian";
import { cn } from "@/lib/utils";

interface PenilaianEmptyStateProps {
  workspace: Omit<PenilaianWorkspace, "kelas">;
  semester: 1 | 2;
  mapelNama?: string;
  onSwitchSemester?: (semester: 1 | 2) => void;
}

export function PenilaianEmptyState({
  workspace,
  semester,
  mapelNama,
  onSwitchSemester,
}: PenilaianEmptyStateProps) {
  const { tpSummaries, tpCountOtherSemester, siswa } = workspace;
  const otherSemester: 1 | 2 = semester === 1 ? 2 : 1;

  if (siswa.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Belum ada siswa aktif</p>
        <p className="mt-1">
          Tambahkan atau impor siswa di kelas ini terlebih dahulu.
        </p>
        <Link href="/siswa" className={cn(buttonVariants(), "mt-4 inline-flex")}>
          Ke Data Siswa
        </Link>
      </div>
    );
  }

  if (tpSummaries.length === 0) {
    return (
      <div className="space-y-4 rounded-lg border border-dashed p-8 text-center text-sm">
        <p className="font-medium text-foreground">
          Belum ada Tujuan Pembelajaran
        </p>
        <p className="text-muted-foreground">
          Tidak ada TP untuk{" "}
          {mapelNama ? (
            <>
              mapel <strong>{mapelNama}</strong>
            </>
          ) : (
            "mapel yang dipilih"
          )}{" "}
          · <strong>Semester {semester}</strong> di kelas yang dipilih.
        </p>
        {tpCountOtherSemester > 0 && onSwitchSemester && (
          <div className="rounded-lg bg-amber-50 px-4 py-3 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            <p>
              Ditemukan <strong>{tpCountOtherSemester} TP</strong> di Semester{" "}
              {otherSemester}. Ganti filter semester untuk menampilkannya.
            </p>
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-3",
              )}
              onClick={() => onSwitchSemester(otherSemester)}
            >
              Tampilkan Semester {otherSemester}
            </button>
          </div>
        )}
        <Link href="/tp" className={cn(buttonVariants(), "inline-flex")}>
          Buat TP &amp; Indikator
        </Link>
      </div>
    );
  }

  const tpWithoutIndikator = tpSummaries.filter((tp) => tp.indikator_count === 0);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed p-6 text-center text-sm">
        <p className="font-medium text-foreground">
          TP sudah ada, indikator belum
        </p>
        <p className="mt-1 text-muted-foreground">
          Penilaian membutuhkan <strong>indikator</strong> di setiap TP. Rubrik
          skala sudah terpasang, tetapi kolom penilaian muncul setelah indikator
          ditambahkan.
        </p>
        <Link href="/tp" className={cn(buttonVariants(), "mt-4 inline-flex")}>
          Tambah Indikator di TP
        </Link>
      </div>

      <div className="rounded-lg border bg-muted/20 p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          TP Semester {semester} (rubrik)
        </p>
        <ul className="space-y-2">
          {tpSummaries.map((tp) => (
            <li
              key={tp.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <div className="min-w-0 text-left">
                <span className="font-semibold">{tp.kode_tp}</span>
                <span className="ml-2 text-muted-foreground line-clamp-1">
                  {tp.deskripsi_tp}
                </span>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {skalaLabel(tp.skala_penilaian)}
                </Badge>
                <Badge
                  variant={tp.indikator_count > 0 ? "default" : "outline"}
                >
                  {tp.indikator_count} indikator
                </Badge>
              </div>
            </li>
          ))}
        </ul>
        {tpWithoutIndikator.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {tpWithoutIndikator.length} TP belum punya indikator — klik TP di
            modul Tujuan Pembelajaran lalu tambahkan indikator.
          </p>
        )}
      </div>
    </div>
  );
}

export function TpRubrikSummaryBar({
  tpSummaries,
}: {
  tpSummaries: PenilaianWorkspace["tpSummaries"];
}) {
  if (tpSummaries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tpSummaries.map((tp) => (
        <Badge
          key={tp.id}
          variant="outline"
          className="max-w-full gap-1 py-1 font-normal"
          title={tp.deskripsi_tp}
        >
          <span className="font-semibold">{tp.kode_tp}</span>
          <span className="text-muted-foreground">·</span>
          <span className="truncate">{skalaLabel(tp.skala_penilaian)}</span>
          <span className="text-muted-foreground">
            ({tp.indikator_count} ind.)
          </span>
        </Badge>
      ))}
    </div>
  );
}
