import { createClient } from "@/lib/supabase/client";
import { fetchSiswaByKelas } from "@/lib/services/siswa";
import type { Absensi, StatusAbsensi } from "@/lib/types/database";

export async function fetchAbsensiByKelasDate(
  kelasId: number,
  tanggal: string,
): Promise<Absensi[]> {
  const siswa = await fetchSiswaByKelas(kelasId);
  const ids = siswa.map((s) => s.id);
  if (ids.length === 0) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("absensi")
    .select("*")
    .in("id_siswa", ids)
    .eq("tanggal", tanggal);

  if (error) throw error;
  return (data ?? []) as Absensi[];
}

export async function fetchAbsensiByKelasRange(
  kelasId: number,
  startDate: string,
  endDate: string,
): Promise<Absensi[]> {
  const siswa = await fetchSiswaByKelas(kelasId);
  const ids = siswa.map((s) => s.id);
  if (ids.length === 0) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("absensi")
    .select("*")
    .in("id_siswa", ids)
    .gte("tanggal", startDate)
    .lte("tanggal", endDate)
    .order("tanggal");

  if (error) throw error;
  return (data ?? []) as Absensi[];
}

export async function upsertAbsensi(input: {
  id_siswa: number;
  tanggal: string;
  status: StatusAbsensi;
  keterangan?: string | null;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("absensi")
    .upsert(
      {
        id_siswa: input.id_siswa,
        tanggal: input.tanggal,
        status: input.status,
        keterangan: input.keterangan?.trim() || null,
      },
      { onConflict: "id_siswa,tanggal" },
    )
    .select()
    .single();

  if (error) throw error;
  return data as Absensi;
}

export async function upsertAbsensiBatch(
  entries: {
    id_siswa: number;
    tanggal: string;
    status: StatusAbsensi;
    keterangan?: string | null;
  }[],
) {
  if (entries.length === 0) return [];

  const supabase = createClient();
  const payload = entries.map((e) => ({
    id_siswa: e.id_siswa,
    tanggal: e.tanggal,
    status: e.status,
    keterangan: e.keterangan?.trim() || null,
  }));

  const { data, error } = await supabase
    .from("absensi")
    .upsert(payload, { onConflict: "id_siswa,tanggal" })
    .select();

  if (error) throw error;
  return (data ?? []) as Absensi[];
}

export async function resetAbsensiByKelasDate(kelasId: number, tanggal: string) {
  const siswa = await fetchSiswaByKelas(kelasId);
  const ids = siswa.map((s) => s.id);
  if (ids.length === 0) return 0;

  const supabase = createClient();
  const { error, count } = await supabase
    .from("absensi")
    .delete({ count: "exact" })
    .in("id_siswa", ids)
    .eq("tanggal", tanggal);

  if (error) throw error;
  return count ?? 0;
}

/** Daftar tanggal YYYY-MM-DD dalam rentang (inklusif). */
export function datesInRange(startDate: string, endDate: string): string[] {
  const out: string[] = [];
  const cur = new Date(startDate + "T12:00:00");
  const end = new Date(endDate + "T12:00:00");

  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** Awal & akhir bulan dari input YYYY-MM */
export function monthRange(ym: string): { start: string; end: string } {
  const [y, m] = ym.split("-").map(Number);
  const start = `${ym}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${ym}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

/** Hari kerja sekolah dalam bulan (Sen–Jum). */
export function schoolDaysInMonth(ym: string): string[] {
  const { start, end } = monthRange(ym);
  return datesInRange(start, end).filter((d) => {
    const day = new Date(d + "T12:00:00").getDay();
    return day >= 1 && day <= 5;
  });
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonthIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
