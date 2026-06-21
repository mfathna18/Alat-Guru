"use client";

import * as React from "react";
import { BookOpen, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useUpdateMapelKelompok } from "@/lib/hooks/use-e-rapor";
import { KELOMPOK_SECTION_LABELS } from "@/lib/rapor/man-template-labels";
import { sortMataPelajaranList } from "@/lib/services/mata-pelajaran";
import { seedManSmaIpsMapel } from "@/lib/services/mata-pelajaran";
import type { MapelKelompok, MataPelajaran } from "@/lib/types/database";
import { formatSupabaseError } from "@/lib/supabase/errors";

const KELOMPOK_OPTIONS: { value: MapelKelompok; label: string }[] = [
  { value: "A", label: KELOMPOK_SECTION_LABELS.A },
  { value: "B", label: KELOMPOK_SECTION_LABELS.B },
  { value: "C", label: KELOMPOK_SECTION_LABELS.C },
  { value: "L", label: KELOMPOK_SECTION_LABELS.L },
];

interface MapelStrukturPanelProps {
  mapelList: MataPelajaran[];
  onSeeded?: () => void;
}

export function MapelStrukturPanel({
  mapelList,
  onSeeded,
}: MapelStrukturPanelProps) {
  const [seeding, setSeeding] = React.useState(false);
  const updateKelompok = useUpdateMapelKelompok();

  const sorted = React.useMemo(
    () => sortMataPelajaranList(mapelList),
    [mapelList],
  );

  async function handleSeedMan() {
    setSeeding(true);
    try {
      const count = await seedManSmaIpsMapel();
      toast.success(`Struktur mapel dibuat (${count} mapel).`);
      onSeeded?.();
    } catch (err) {
      toast.error(formatSupabaseError(err));
    } finally {
      setSeeding(false);
    }
  }

  async function handleKelompokChange(mapelId: number, kelompok: MapelKelompok) {
    try {
      await updateKelompok.mutateAsync({ mapelId, kelompok });
      toast.success("Kelompok mapel diperbarui");
    } catch (err) {
      toast.error(formatSupabaseError(err));
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="size-4" />
          Atur Mapel per Kelompok
        </CardTitle>
        <CardDescription>
          Tentukan kelompok A/B/C/L untuk setiap mata pelajaran sesuai
          preferensi Anda. Perubahan langsung memengaruhi tampilan rapor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mapelList.length === 0 ? (
          <>
            <p className="text-sm text-muted-foreground">
              Belum ada mata pelajaran. Muat struktur default terlebih dahulu,
              lalu sesuaikan kelompoknya.
            </p>
            <Button
              type="button"
              variant="outline"
              className="min-h-9"
              disabled={seeding}
              onClick={() => void handleSeedMan()}
            >
              {seeding ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4" />
              )}
              Muat Struktur Mapel Default
            </Button>
          </>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs">
                    <th className="px-3 py-2 font-medium">Mata Pelajaran</th>
                    <th className="px-3 py-2 font-medium">Kelompok Rapor</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((m) => {
                    const kelompok =
                      m.kelompok_mapel === "B" ||
                      m.kelompok_mapel === "C" ||
                      m.kelompok_mapel === "L"
                        ? m.kelompok_mapel
                        : "A";
                    const isHeader = Boolean(m.is_group_header);

                    return (
                      <tr key={m.id} className="border-b last:border-0">
                        <td className="px-3 py-2">
                          <span className={m.parent_id ? "pl-4 text-muted-foreground" : ""}>
                            {m.nama_mapel}
                          </span>
                          {isHeader && (
                            <Badge
                              variant="outline"
                              className="ml-2 h-4 px-1 text-[9px]"
                            >
                              grup
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {isHeader ? (
                            <span className="text-xs text-muted-foreground">
                              Kelompok A (header)
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <Label htmlFor={`kelompok-${m.id}`} className="sr-only">
                                Kelompok {m.nama_mapel}
                              </Label>
                              <select
                                id={`kelompok-${m.id}`}
                                className="h-9 w-full max-w-xs rounded-md border border-input bg-background px-2 text-sm"
                                value={kelompok}
                                disabled={updateKelompok.isPending}
                                onChange={(e) =>
                                  void handleKelompokChange(
                                    m.id,
                                    e.target.value as MapelKelompok,
                                  )
                                }
                              >
                                {KELOMPOK_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
