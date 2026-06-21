"use client";

import * as React from "react";
import { HeartHandshake, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { SiswaSikapEditor } from "@/components/sikap-rapor/siswa-sikap-editor";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { semesterLabel } from "@/lib/rapor/semester-labels";
import { useGuruProfile } from "@/lib/hooks/use-guru-profile";
import { useKelasList } from "@/lib/hooks/use-penilaian";
import { usePengaturanSekolah } from "@/lib/hooks/use-pengaturan";
import {
  useCreateEkstrakurikuler,
  useDeleteEkstrakurikuler,
  useRaporWaliKelasWorkspace,
} from "@/lib/hooks/use-rapor-wali-kelas";
import { hasSikapDeskripsi } from "@/lib/rapor/sikap-deskripsi";
import { cn } from "@/lib/utils";

export function SikapRaporManager() {
  const { data: kelasList = [], isLoading: loadingKelas } = useKelasList();
  const { data: guru } = useGuruProfile();
  const { data: pengaturan } = usePengaturanSekolah(guru?.id);

  const [kelasId, setKelasId] = React.useState<number | null>(null);
  const [semester, setSemester] = React.useState<1 | 2>(1);
  const [tahunAjaran, setTahunAjaran] = React.useState("2025/2026");
  const [selectedSiswaId, setSelectedSiswaId] = React.useState<number | null>(
    null,
  );
  const [newEkskulNama, setNewEkskulNama] = React.useState("");

  React.useEffect(() => {
    if (kelasId == null && kelasList.length > 0) {
      setKelasId(kelasList[0].id);
    }
  }, [kelasList, kelasId]);

  React.useEffect(() => {
    if (pengaturan?.tahun_ajaran) {
      setTahunAjaran(pengaturan.tahun_ajaran);
    }
  }, [pengaturan?.tahun_ajaran]);

  const { data: workspace, isLoading, error } = useRaporWaliKelasWorkspace(
    kelasId,
    semester,
    tahunAjaran,
  );

  const createEkskul = useCreateEkstrakurikuler(kelasId, semester, tahunAjaran);
  const deleteEkskulMaster = useDeleteEkstrakurikuler(
    kelasId,
    semester,
    tahunAjaran,
  );

  React.useEffect(() => {
    if (!workspace?.siswaRows.length) {
      setSelectedSiswaId(null);
      return;
    }
    if (
      selectedSiswaId == null ||
      !workspace.siswaRows.some((r) => r.siswa.id === selectedSiswaId)
    ) {
      setSelectedSiswaId(workspace.siswaRows[0].siswa.id);
    }
  }, [workspace, selectedSiswaId]);

  const selectedRow = workspace?.siswaRows.find(
    (r) => r.siswa.id === selectedSiswaId,
  );

  async function handleAddEkskulMaster() {
    const nama = newEkskulNama.trim();
    if (!nama) {
      toast.error("Nama kegiatan wajib diisi.");
      return;
    }
    try {
      await createEkskul.mutateAsync({ nama });
      setNewEkskulNama("");
      toast.success("Kegiatan ekstrakurikuler ditambahkan.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambah kegiatan.");
    }
  }

  async function handleDeleteEkskulMaster(id: number, nama: string) {
    if (!window.confirm(`Hapus kegiatan "${nama}" dari daftar master?`)) return;
    try {
      await deleteEkskulMaster.mutateAsync(id);
      toast.success("Kegiatan dihapus.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus kegiatan.");
    }
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <HeartHandshake className="size-7" />
          Sikap Spiritual & Sosial
        </h1>
        <p className="text-sm text-muted-foreground">
          Isi sikap spiritual-sosial, ekstrakurikuler, dan catatan wali kelas
          untuk rapor.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter</CardTitle>
          <CardDescription>Pilih kelas, semester, dan tahun ajaran</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterDropdown
            label="Kelas"
            value={kelasId != null ? String(kelasId) : null}
            options={kelasList.map((k) => ({
              value: String(k.id),
              label: k.nama_kelas,
            }))}
            onChange={(v) => setKelasId(Number(v))}
            placeholder="Pilih kelas"
            emptyMessage="Belum ada kelas"
            disabled={loadingKelas}
          />

          <FilterDropdown
            label="Semester"
            value={String(semester)}
            options={([1, 2] as const).map((s) => ({
              value: String(s),
              label: `Semester ${semesterLabel(s)}`,
            }))}
            onChange={(v) => setSemester(Number(v) as 1 | 2)}
          />

          <div className="space-y-1.5">
            <Label htmlFor="ta-sikap">Tahun ajaran</Label>
            <Input
              id="ta-sikap"
              value={tahunAjaran}
              onChange={(e) => setTahunAjaran(e.target.value)}
              className="h-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Kegiatan Ekstrakurikuler</CardTitle>
          <CardDescription>
            Master kegiatan yang bisa dipilih per siswa di rapor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input
              value={newEkskulNama}
              onChange={(e) => setNewEkskulNama(e.target.value)}
              placeholder="Nama kegiatan (mis. Pramuka, PMR)"
              className="max-w-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleAddEkskulMaster();
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="min-h-9"
              disabled={createEkskul.isPending}
              onClick={() => void handleAddEkskulMaster()}
            >
              {createEkskul.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Plus className="mr-2 size-4" />
              )}
              Tambah Kegiatan
            </Button>
          </div>

          {(workspace?.ekskulMaster.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada kegiatan. Tambahkan minimal satu kegiatan ekstrakurikuler.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {workspace!.ekskulMaster.map((ex) => (
                <li
                  key={ex.id}
                  className="flex items-center gap-1 rounded-md border bg-muted/30 px-2 py-1 text-sm"
                >
                  <span>{ex.nama_ekskul}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive"
                    disabled={deleteEkskulMaster.isPending}
                    onClick={() => void handleDeleteEkskulMaster(ex.id, ex.nama_ekskul)}
                    title="Hapus kegiatan"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" />
          Memuat data siswa…
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-destructive">
            {error instanceof Error ? error.message : "Gagal memuat data."}
          </CardContent>
        </Card>
      )}

      {workspace && workspace.siswaRows.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Belum ada siswa aktif di kelas ini.
          </CardContent>
        </Card>
      )}

      {workspace && workspace.siswaRows.length > 0 && kelasId && (
        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <Card className="h-fit lg:sticky lg:top-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Daftar Siswa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-2 pt-0">
              {workspace.siswaRows.map((row) => {
                const active = row.siswa.id === selectedSiswaId;
                const hasData = Boolean(
                  hasSikapDeskripsi(row.eRapor) ||
                    row.eRapor?.catatan_wali_kelas ||
                    row.ekstrakurikuler.length > 0,
                );
                return (
                  <button
                    key={row.siswa.id}
                    type="button"
                    onClick={() => setSelectedSiswaId(row.siswa.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    <span className="truncate font-medium">
                      {row.siswa.nama_siswa}
                    </span>
                    {hasData && (
                      <span
                        className={cn(
                          "ml-2 size-2 shrink-0 rounded-full",
                          active ? "bg-primary-foreground" : "bg-primary",
                        )}
                        title="Sudah ada data"
                      />
                    )}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              {selectedRow && (
                <SiswaSikapEditor
                  key={selectedRow.siswa.id}
                  row={selectedRow}
                  kelasId={kelasId}
                  semester={semester}
                  tahunAjaran={tahunAjaran}
                  ekskulMaster={workspace.ekskulMaster}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
