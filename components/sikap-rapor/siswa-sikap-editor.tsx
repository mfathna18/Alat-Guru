"use client";

import * as React from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { predikatLabel } from "@/lib/e-rapor/predikat";
import { readSikapDeskripsi } from "@/lib/rapor/sikap-deskripsi";
import {
  useDeleteSiswaEkstrakurikuler,
  useUpsertERaporSikapCatatan,
  useUpsertSiswaEkstrakurikuler,
} from "@/lib/hooks/use-rapor-wali-kelas";
import type { SiswaRaporWaliKelasRow } from "@/lib/services/rapor-wali-kelas";
import type { Ekstrakurikuler, SkorKualitatif } from "@/lib/types/database";

const PREDIKAT_OPTIONS: { value: SkorKualitatif; label: string }[] = [
  { value: "SB", label: `SB — ${predikatLabel("SB")}` },
  { value: "BSH", label: `BSH — ${predikatLabel("BSH")}` },
  { value: "MB", label: `MB — ${predikatLabel("MB")}` },
  { value: "BB", label: `BB — ${predikatLabel("BB")}` },
];

interface EkskulDraftRow {
  key: string;
  id?: number;
  id_ekstrakurikuler: number | null;
  predikat_kualitatif: SkorKualitatif | null;
  deskripsi_capaian: string;
}

interface SiswaSikapEditorProps {
  row: SiswaRaporWaliKelasRow;
  kelasId: number;
  semester: 1 | 2;
  tahunAjaran: string;
  ekskulMaster: Ekstrakurikuler[];
}

export function SiswaSikapEditor({
  row,
  kelasId,
  semester,
  tahunAjaran,
  ekskulMaster,
}: SiswaSikapEditorProps) {
  const { siswa, eRapor, ekstrakurikuler } = row;

  const [sikapDeskripsi, setSikapDeskripsi] = React.useState(
    readSikapDeskripsi(eRapor),
  );
  const [catatan, setCatatan] = React.useState(eRapor?.catatan_wali_kelas ?? "");
  const [ekskulRows, setEkskulRows] = React.useState<EkskulDraftRow[]>(() =>
    ekstrakurikuler.map((ex) => ({
      key: `saved-${ex.id}`,
      id: ex.id,
      id_ekstrakurikuler: ex.id_ekstrakurikuler,
      predikat_kualitatif: ex.predikat_kualitatif,
      deskripsi_capaian: ex.deskripsi_capaian ?? "",
    })),
  );

  React.useEffect(() => {
    setSikapDeskripsi(readSikapDeskripsi(eRapor));
    setCatatan(eRapor?.catatan_wali_kelas ?? "");
    setEkskulRows(
      ekstrakurikuler.map((ex) => ({
        key: `saved-${ex.id}`,
        id: ex.id,
        id_ekstrakurikuler: ex.id_ekstrakurikuler,
        predikat_kualitatif: ex.predikat_kualitatif,
        deskripsi_capaian: ex.deskripsi_capaian ?? "",
      })),
    );
  }, [siswa.id, eRapor, ekstrakurikuler]);

  const saveSikap = useUpsertERaporSikapCatatan(kelasId, semester, tahunAjaran);
  const saveEkskul = useUpsertSiswaEkstrakurikuler(kelasId, semester, tahunAjaran);
  const deleteEkskul = useDeleteSiswaEkstrakurikuler(
    kelasId,
    semester,
    tahunAjaran,
  );

  const ekskulOptions = ekskulMaster.map((e) => ({
    value: String(e.id),
    label: e.nama_ekskul,
  }));

  function addEkskulRow() {
    setEkskulRows((rows) => [
      ...rows,
      {
        key: `new-${Date.now()}`,
        id_ekstrakurikuler: ekskulMaster[0]?.id ?? null,
        predikat_kualitatif: null,
        deskripsi_capaian: "",
      },
    ]);
  }

  function updateEkskulRow(key: string, patch: Partial<EkskulDraftRow>) {
    setEkskulRows((rows) =>
      rows.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }

  async function handleSaveSikapCatatan() {
    try {
      await saveSikap.mutateAsync({
        id_siswa: siswa.id,
        id_kelas: kelasId,
        semester,
        tahun_ajaran: tahunAjaran,
        sikap_deskripsi: sikapDeskripsi,
        catatan_wali_kelas: catatan,
      });
      toast.success(`Sikap & catatan ${siswa.nama_siswa} disimpan.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan.");
    }
  }

  async function handleSaveEkskulRow(draft: EkskulDraftRow) {
    if (!draft.id_ekstrakurikuler) {
      toast.error("Pilih kegiatan ekstrakurikuler.");
      return;
    }
    try {
      await saveEkskul.mutateAsync({
        id_siswa: siswa.id,
        id_ekstrakurikuler: draft.id_ekstrakurikuler,
        semester,
        tahun_ajaran: tahunAjaran,
        predikat_kualitatif: draft.predikat_kualitatif,
        deskripsi_capaian: draft.deskripsi_capaian,
      });
      toast.success("Baris ekstrakurikuler disimpan.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan ekskul.");
    }
  }

  async function handleDeleteEkskulRow(draft: EkskulDraftRow) {
    if (draft.id) {
      try {
        await deleteEkskul.mutateAsync(draft.id);
        toast.success("Baris ekstrakurikuler dihapus.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menghapus.");
        return;
      }
    }
    setEkskulRows((rows) => rows.filter((r) => r.key !== draft.key));
  }

  const busy =
    saveSikap.isPending || saveEkskul.isPending || deleteEkskul.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{siswa.nama_siswa}</h2>
        {siswa.nisn && (
          <p className="text-sm text-muted-foreground">NISN {siswa.nisn}</p>
        )}
      </div>

      <section className="space-y-2 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">A. Sikap Spiritual dan Sosial</h3>
        <Label htmlFor={`sikap-${siswa.id}`}>Deskripsi</Label>
        <Textarea
          id={`sikap-${siswa.id}`}
          value={sikapDeskripsi}
          onChange={(e) => setSikapDeskripsi(e.target.value)}
          rows={5}
          placeholder="Contoh: Siswa menunjukkan sikap religius, sopan, jujur, dan bekerja sama…"
        />
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Ekstrakurikuler</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={ekskulMaster.length === 0 || busy}
            onClick={addEkskulRow}
          >
            <Plus className="mr-1 size-4" />
            Tambah Baris
          </Button>
        </div>

        {ekskulMaster.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tambah daftar kegiatan ekstrakurikuler di bagian atas halaman
            terlebih dahulu.
          </p>
        ) : ekskulRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada ekstrakurikuler untuk siswa ini.
          </p>
        ) : (
          <div className="space-y-3">
            {ekskulRows.map((draft, index) => (
              <div
                key={draft.key}
                className="grid gap-3 rounded-md border bg-muted/20 p-3 sm:grid-cols-2 lg:grid-cols-[1fr_140px_1fr_auto]"
              >
                <div className="space-y-1">
                  <Label className="text-xs">Kegiatan</Label>
                  <FilterDropdown
                    label=""
                    value={
                      draft.id_ekstrakurikuler != null
                        ? String(draft.id_ekstrakurikuler)
                        : null
                    }
                    options={ekskulOptions}
                    onChange={(v) =>
                      updateEkskulRow(draft.key, {
                        id_ekstrakurikuler: Number(v),
                      })
                    }
                    placeholder="Pilih kegiatan"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Predikat</Label>
                  <FilterDropdown
                    label=""
                    value={draft.predikat_kualitatif}
                    options={PREDIKAT_OPTIONS.map((o) => ({
                      value: o.value,
                      label: o.label,
                    }))}
                    onChange={(v) =>
                      updateEkskulRow(draft.key, {
                        predikat_kualitatif: v as SkorKualitatif,
                      })
                    }
                    placeholder="Predikat"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                  <Label className="text-xs">Keterangan</Label>
                  <Textarea
                    value={draft.deskripsi_capaian}
                    onChange={(e) =>
                      updateEkskulRow(draft.key, {
                        deskripsi_capaian: e.target.value,
                      })
                    }
                    rows={2}
                    placeholder="Deskripsi capaian kegiatan"
                  />
                </div>

                <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1 lg:flex-col lg:items-stretch">
                  <Button
                    type="button"
                    size="sm"
                    className="min-h-9 flex-1"
                    disabled={busy}
                    onClick={() => void handleSaveEkskulRow(draft)}
                  >
                    {saveEkskul.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Simpan"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-9"
                    disabled={busy}
                    onClick={() => void handleDeleteEkskulRow(draft)}
                    title={`Hapus baris ${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2 rounded-lg border p-4">
        <Label htmlFor={`catatan-${siswa.id}`}>Catatan Wali Kelas</Label>
        <Textarea
          id={`catatan-${siswa.id}`}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          rows={4}
          placeholder="Catatan umum wali kelas untuk semester ini…"
        />
      </section>

      <Button
        type="button"
        className="min-h-10"
        disabled={busy}
        onClick={() => void handleSaveSikapCatatan()}
      >
        {saveSikap.isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Menyimpan…
          </>
        ) : (
          "Simpan Sikap & Catatan Wali Kelas"
        )}
      </Button>
    </div>
  );
}
