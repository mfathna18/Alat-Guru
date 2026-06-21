"use client";

import * as React from "react";
import { RotateCcw, Sparkles } from "lucide-react";

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
import type { Siswa } from "@/lib/types/database";
import { cn } from "@/lib/utils";

const WHEEL_COLORS = [
  "hsl(221 83% 53%)",
  "hsl(262 83% 58%)",
  "hsl(291 64% 42%)",
  "hsl(330 81% 60%)",
  "hsl(347 77% 50%)",
  "hsl(24 95% 53%)",
  "hsl(45 93% 47%)",
  "hsl(84 81% 44%)",
  "hsl(142 71% 45%)",
  "hsl(173 80% 40%)",
  "hsl(199 89% 48%)",
  "hsl(204 94% 44%)",
];

const SPIN_MS = 4200;

interface SpinnerWheelProps {
  students: Siswa[];
}

export function SpinnerWheel({ students }: SpinnerWheelProps) {
  const [pool, setPool] = React.useState<Siswa[]>(students);
  const [rotation, setRotation] = React.useState(0);
  const [spinning, setSpinning] = React.useState(false);
  const [winner, setWinner] = React.useState<Siswa | null>(null);
  const [excludePicked, setExcludePicked] = React.useState(true);

  React.useEffect(() => {
    setPool(students);
    setWinner(null);
    setRotation(0);
    setSpinning(false);
  }, [students]);

  const count = pool.length;
  const segmentAngle = count > 0 ? 360 / count : 0;

  const conicGradient = React.useMemo(() => {
    if (count === 0) return undefined;
    const stops: string[] = [];
    for (let i = 0; i < count; i++) {
      const start = i * segmentAngle;
      const end = (i + 1) * segmentAngle;
      stops.push(
        `${WHEEL_COLORS[i % WHEEL_COLORS.length]} ${start}deg ${end}deg`,
      );
    }
    return `conic-gradient(from -90deg, ${stops.join(", ")})`;
  }, [count, segmentAngle]);

  function spin() {
    if (spinning || count === 0) return;

    setSpinning(true);
    setWinner(null);

    const winnerIndex = Math.floor(Math.random() * count);
    const spins = 4 + Math.floor(Math.random() * 4);
    const offset = winnerIndex * segmentAngle + segmentAngle / 2;
    const finalRotation = rotation + spins * 360 + (360 - offset);

    setRotation(finalRotation);

    window.setTimeout(() => {
      const picked = pool[winnerIndex];
      setWinner(picked);
      setSpinning(false);

      if (excludePicked && count > 1) {
        setPool((prev) => prev.filter((s) => s.id !== picked.id));
        setRotation(0);
      }
    }, SPIN_MS);
  }

  function resetPool() {
    setPool(students);
    setWinner(null);
    setRotation(0);
    setSpinning(false);
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
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" />
            Spinner Undian
          </CardTitle>
          <CardDescription>
            Putar roda untuk mengundi siswa secara acak saat tanya jawab.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="relative flex size-64 items-center justify-center sm:size-80">
            <div
              className="absolute -top-1 z-10 size-0 border-x-[10px] border-b-[18px] border-x-transparent border-b-primary drop-shadow-sm"
              aria-hidden
            />
            <div
              className={cn(
                "relative size-full rounded-full border-4 border-background shadow-lg ring-2 ring-border",
                spinning && "transition-transform ease-out",
              )}
              style={{
                background: conicGradient,
                transform: `rotate(${rotation}deg)`,
                transitionDuration: spinning ? `${SPIN_MS}ms` : undefined,
              }}
            >
              <div className="absolute inset-[18%] flex items-center justify-center rounded-full bg-background shadow-inner">
                <span className="text-center text-xs font-medium text-muted-foreground">
                  {spinning ? "..." : count > 0 ? `${count} siswa` : "—"}
                </span>
              </div>
            </div>
          </div>

          {winner && !spinning && (
            <div className="animate-in fade-in zoom-in-95 w-full rounded-xl border-2 border-primary bg-primary/5 px-4 py-6 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Terpilih
              </p>
              <p className="mt-1 text-2xl font-bold text-primary">
                {winner.nama_siswa}
              </p>
              {winner.nisn && (
                <p className="mt-1 text-xs text-muted-foreground">
                  NISN {winner.nisn}
                </p>
              )}
            </div>
          )}

          <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              className="min-h-11 flex-1 text-base"
              size="lg"
              onClick={spin}
              disabled={spinning || count === 0}
            >
              <Sparkles className="mr-2 size-4" />
              {spinning ? "Memutar..." : "Putar Roda"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={resetPool}
              disabled={spinning}
            >
              <RotateCcw className="mr-2 size-4" />
              Reset
            </Button>
          </div>

          <div className="flex w-full max-w-sm items-center justify-between gap-3 rounded-lg border px-3 py-2">
            <Label className="text-sm">Jangan undi nama yang sama</Label>
            <button
              type="button"
              role="switch"
              aria-checked={excludePicked}
              disabled={spinning}
              onClick={() => setExcludePicked((v) => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors",
                excludePicked ? "bg-primary" : "bg-muted",
                spinning && "opacity-50",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none block size-5 rounded-full bg-background shadow-sm transition-transform",
                  excludePicked ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Pool undian</CardTitle>
          <CardDescription>
            {count === 0
              ? "Semua siswa sudah terundi. Reset untuk mengulang."
              : `${count} siswa tersisa`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="max-h-80 space-y-1 overflow-y-auto text-sm">
            {(count > 0 ? pool : students).map((s, i) => (
              <li
                key={s.id}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5",
                  winner?.id === s.id && !spinning && "bg-primary/10 font-medium",
                )}
              >
                <span className="text-muted-foreground">{i + 1}.</span>
                <span className="truncate">{s.nama_siswa}</span>
                {winner?.id === s.id && !spinning && (
                  <Badge className="ml-auto shrink-0">Terpilih</Badge>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
