"use client";

import * as React from "react";
import { Copy, Shuffle, Users } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GROUP_CARD_COLORS,
  randomGroups,
  type GroupMode,
} from "@/lib/kelas-tools/random-groups";
import type { Siswa } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface GroupRandomizerProps {
  students: Siswa[];
  kelasName?: string;
}

export function GroupRandomizer({ students, kelasName }: GroupRandomizerProps) {
  const [mode, setMode] = React.useState<GroupMode>("count");
  const [value, setValue] = React.useState(4);
  const [groups, setGroups] = React.useState<Siswa[][]>([]);
  const [seed, setSeed] = React.useState(0);

  const maxValue =
    mode === "count"
      ? Math.max(2, students.length)
      : Math.max(2, students.length);

  React.useEffect(() => {
    if (students.length > 0) {
      setValue((v) =>
        mode === "count"
          ? Math.min(Math.max(2, v), students.length)
          : Math.min(Math.max(2, v), Math.ceil(students.length / 2)),
      );
    }
  }, [students.length, mode]);

  function generate() {
    if (students.length < 2) {
      toast.error("Minimal 2 siswa untuk dibagi kelompok.");
      return;
    }
    const next = randomGroups(students, mode, value);
    setGroups(next);
    setSeed((s) => s + 1);
    toast.success(`${next.length} kelompok siap!`);
  }

  async function copyGroups() {
    if (groups.length === 0) return;
    const text = groups
      .map(
        (g, i) =>
          `Kelompok ${i + 1} (${g.length} siswa):\n${g.map((s) => `- ${s.nama_siswa}`).join("\n")}`,
      )
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Daftar kelompok disalin ke clipboard.");
    } catch {
      toast.error("Gagal menyalin. Salin manual dari layar.");
    }
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Belum ada siswa di kelas ini. Tambahkan siswa terlebih dahulu.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shuffle className="size-4 text-primary" />
            Acak Kelompok
          </CardTitle>
          <CardDescription>
            Bagi {students.length} siswa{kelasName ? ` di ${kelasName}` : ""}{" "}
            secara adil — tanpa pilih kasih.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Mode pembagian</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={mode === "count" ? "default" : "outline"}
                className="min-h-9"
                onClick={() => setMode("count")}
              >
                Jumlah kelompok
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "size" ? "default" : "outline"}
                className="min-h-9"
                onClick={() => setMode("size")}
              >
                Siswa per kelompok
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-2 sm:w-48">
              <Label htmlFor="group-value">
                {mode === "count" ? "Jumlah kelompok" : "Siswa per kelompok"}
              </Label>
              <Input
                id="group-value"
                type="number"
                min={2}
                max={maxValue}
                value={value}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (!Number.isNaN(n)) setValue(n);
                }}
                className="min-h-10"
              />
            </div>
            <Button
              type="button"
              className="min-h-11 sm:flex-1"
              onClick={generate}
              disabled={students.length < 2}
            >
              <Shuffle className="mr-2 size-4" />
              Acak Kelompok Sekarang
            </Button>
          </div>
        </CardContent>
      </Card>

      {groups.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                Hasil: {groups.length} kelompok
              </span>
              <Badge variant="outline">{students.length} siswa</Badge>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={copyGroups}>
                <Copy className="mr-1.5 size-3.5" />
                Salin
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={generate}>
                <Shuffle className="mr-1.5 size-3.5" />
                Acak Ulang
              </Button>
            </div>
          </div>

          <div
            key={seed}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {groups.map((group, i) => (
              <Card
                key={`${seed}-${i}`}
                className={cn(
                  "border-l-4",
                  GROUP_CARD_COLORS[i % GROUP_CARD_COLORS.length],
                )}
              >
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm">
                    Kelompok {i + 1}
                    <Badge variant="secondary" className="ml-2 font-normal">
                      {group.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <ol className="space-y-1 text-sm">
                    {group.map((s, idx) => (
                      <li key={s.id} className="flex gap-2">
                        <span className="text-muted-foreground">{idx + 1}.</span>
                        <span className="font-medium">{s.nama_siswa}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
