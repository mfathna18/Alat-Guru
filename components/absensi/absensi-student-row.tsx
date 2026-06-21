"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  requiresKeterangan,
  STATUS_OPTIONS,
  STATUS_STYLE,
} from "@/lib/absensi/status-config";
import type { StatusAbsensi } from "@/lib/types/database";
import { cn } from "@/lib/utils";

export interface AbsensiRowData {
  id: number;
  nama_siswa: string;
  nisn: string | null;
  status?: StatusAbsensi;
  keterangan?: string | null;
}

interface AbsensiStudentRowProps {
  siswa: AbsensiRowData;
  index: number;
  isMobile?: boolean;
  saving?: boolean;
  onSave: (
    siswaId: number,
    status: StatusAbsensi,
    keterangan: string | null,
  ) => Promise<void>;
}

export function AbsensiStudentRow({
  siswa,
  index,
  isMobile,
  saving,
  onSave,
}: AbsensiStudentRowProps) {
  const [status, setStatus] = React.useState<StatusAbsensi | undefined>(
    siswa.status,
  );
  const [keterangan, setKeterangan] = React.useState(siswa.keterangan ?? "");
  const [keteranganError, setKeteranganError] = React.useState(false);

  React.useEffect(() => {
    setStatus(siswa.status);
    setKeterangan(siswa.keterangan ?? "");
    setKeteranganError(false);
  }, [siswa.status, siswa.keterangan, siswa.id]);

  async function applyStatus(next: StatusAbsensi) {
    setKeteranganError(false);
    const ket =
      next === "H" || next === "A" ? null : keterangan.trim() || null;

    if (requiresKeterangan(next) && !ket) {
      setStatus(next);
      setKeteranganError(true);
      return;
    }

    setStatus(next);
    if (next === "H" || next === "A") {
      setKeterangan("");
    }
    await onSave(siswa.id, next, ket);
  }

  async function saveKeterangan() {
    if (!status) return;
    const ket = keterangan.trim();
    if (requiresKeterangan(status) && !ket) {
      setKeteranganError(true);
      return;
    }
    setKeteranganError(false);
    await onSave(siswa.id, status, status === "H" ? null : ket);
  }

  const style = status ? STATUS_STYLE[status] : null;

  const statusPicker = (
    <div className="flex gap-1">
      {STATUS_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={saving}
          title={opt.label}
          onClick={() => applyStatus(opt.value)}
          className={cn(
            "min-h-9 min-w-9 rounded-md border text-xs font-semibold transition-colors",
            isMobile && "min-h-11 min-w-11 flex-1",
            status === opt.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:bg-muted",
          )}
        >
          {saving ? <Loader2 className="mx-auto size-3.5 animate-spin" /> : opt.short}
        </button>
      ))}
    </div>
  );

  const keteranganField =
    status && requiresKeterangan(status) ? (
      <div className="space-y-1">
        <Input
          className={cn(
            "min-h-9 text-sm",
            keteranganError && "border-destructive",
          )}
          placeholder={
            status === "S"
              ? "Contoh: Demam"
              : "Contoh: Keperluan keluarga"
          }
          value={keterangan}
          onChange={(e) => {
            setKeterangan(e.target.value);
            setKeteranganError(false);
          }}
          onBlur={saveKeterangan}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void saveKeterangan();
            }
          }}
        />
        {keteranganError && (
          <p className="text-xs text-destructive">
            Keterangan wajib untuk status {STATUS_STYLE[status].label}
          </p>
        )}
      </div>
    ) : null;

  if (isMobile) {
    return (
      <li className="rounded-xl border p-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium leading-snug">
              <span className="text-muted-foreground">{index + 1}. </span>
              {siswa.nama_siswa}
            </p>
            {siswa.nisn && (
              <p className="text-xs text-muted-foreground">NISN {siswa.nisn}</p>
            )}
          </div>
          {style && (
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                style.badge,
              )}
            >
              <span className={cn("size-1.5 rounded-full", style.dot)} />
              {style.label}
            </span>
          )}
        </div>
        {statusPicker}
        {keteranganField}
      </li>
    );
  }

  return (
    <tr className="border-b last:border-0 hover:bg-muted/20">
      <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
      <td className="px-3 py-2 font-medium">{siswa.nama_siswa}</td>
      <td className="px-3 py-2 text-muted-foreground">{siswa.nisn ?? "—"}</td>
      <td className="px-3 py-2">
        {style ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
              style.badge,
            )}
          >
            <span className={cn("size-1.5 rounded-full", style.dot)} />
            {style.label}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-3 py-2">{statusPicker}</td>
      <td className="min-w-[180px] px-3 py-2">{keteranganField}</td>
    </tr>
  );
}
