"use client";

import * as React from "react";
import { Loader2, Shuffle, Sparkles } from "lucide-react";
import Link from "next/link";

import { GroupRandomizer } from "@/components/kelas-tools/group-randomizer";
import { SpinnerWheel } from "@/components/kelas-tools/spinner-wheel";
import { KelasFilterBar } from "@/components/shared/kelas-filter-bar";
import { KelasFilterSheet } from "@/components/shared/kelas-filter-sheet";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useViewportMode } from "@/hooks/use-viewport-mode";
import { useKelasList } from "@/lib/hooks/use-kelas";
import { useSiswaList } from "@/lib/hooks/use-siswa";
import { cn } from "@/lib/utils";

export function AlatKelasManager() {
  const mode = useViewportMode();
  const isMobile = mode === "mobile";

  const { data: kelasList = [], isLoading: loadingKelas } = useKelasList();
  const [kelasId, setKelasId] = React.useState<number | null>(null);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [tab, setTab] = React.useState("kelompok");

  React.useEffect(() => {
    if (kelasId == null && kelasList.length > 0) {
      setKelasId(kelasList[0].id);
    }
  }, [kelasList, kelasId]);

  const { data: siswaList = [], isLoading: loadingSiswa } = useSiswaList(
    kelasId,
    false,
  );

  const selectedKelas = kelasList.find((k) => k.id === kelasId);
  const loading = loadingKelas || loadingSiswa;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Shuffle className="size-3" />
            Anti-Pilih Kasih
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Alat Kelas</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Acak kelompok siswa dan undi nama untuk kegiatan di kelas.
        </p>
      </div>

      {kelasList.length === 0 && !loadingKelas ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Belum ada kelas. Buat kelas dan tambahkan siswa terlebih dahulu.
          </p>
          <Link
            href="/kelas"
            className={cn(buttonVariants(), "mt-4 inline-flex")}
          >
            Kelola Kelas
          </Link>
        </div>
      ) : (
        <>
          <KelasFilterBar
            kelasId={kelasId}
            kelasList={kelasList}
            onChange={setKelasId}
            isMobile={isMobile}
            onOpenMobile={() => setFilterOpen(true)}
          />
          <KelasFilterSheet
            open={filterOpen}
            onOpenChange={setFilterOpen}
            kelasId={kelasId}
            kelasList={kelasList}
            onChange={setKelasId}
            title="Pilih Kelas"
          />

          {loading ? (
            <div className="flex min-h-40 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" />
              Memuat data siswa...
            </div>
          ) : (
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid h-auto w-full grid-cols-2 sm:w-fit">
                <TabsTrigger value="kelompok" className="min-h-10 gap-1.5">
                  <Shuffle className="size-4" />
                  Acak Kelompok
                </TabsTrigger>
                <TabsTrigger value="spinner" className="min-h-10 gap-1.5">
                  <Sparkles className="size-4" />
                  Spinner Undian
                </TabsTrigger>
              </TabsList>

              <TabsContent value="kelompok" className="mt-4">
                <GroupRandomizer
                  students={siswaList}
                  kelasName={selectedKelas?.nama_kelas}
                />
              </TabsContent>

              <TabsContent value="spinner" className="mt-4">
                <SpinnerWheel students={siswaList} />
              </TabsContent>
            </Tabs>
          )}
        </>
      )}
    </div>
  );
}
