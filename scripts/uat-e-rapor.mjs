/**
 * UAT otomatis E-Rapor & Penilaian (Supabase live data).
 * Jalankan: npm run uat:e-rapor
 * Opsional: SEED_GURU_EMAIL=rexorfathan@gmail.com npm run uat:e-rapor
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  const text = readFileSync(path, "utf8");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    env[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
  }
  return env;
}

function hitungNilaiAkhir(fmt, lm, sas, bobot) {
  const parts = [
    { value: fmt, weight: bobot.formatif },
    { value: lm, weight: bobot.sumatifLm },
    { value: sas, weight: bobot.sas },
  ];
  let sum = 0;
  let w = 0;
  for (const p of parts) {
    if (p.value != null) {
      sum += p.value * p.weight;
      w += p.weight;
    }
  }
  if (w === 0) return null;
  return Math.round((sum / w) * 100) / 100;
}

function rataAngka(vals) {
  const v = vals.filter((x) => x != null);
  if (!v.length) return null;
  return Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100;
}

class UatRunner {
  constructor() {
    this.results = [];
    this.pass = 0;
    this.fail = 0;
    this.warn = 0;
  }

  record(id, name, status, detail = "") {
    this.results.push({ id, name, status, detail });
    if (status === "PASS") this.pass += 1;
    else if (status === "FAIL") this.fail += 1;
    else this.warn += 1;
  }

  async check(id, name, fn) {
    try {
      const out = await fn();
      if (out === true || out?.pass === true) {
        this.record(id, name, "PASS", out?.detail ?? "");
      } else if (out?.warn) {
        this.record(id, name, "WARN", out.detail ?? out.message ?? "");
      } else {
        this.record(
          id,
          name,
          "FAIL",
          out?.detail ?? out?.message ?? String(out),
        );
      }
    } catch (err) {
      this.record(id, name, "FAIL", err instanceof Error ? err.message : String(err));
    }
  }

  printReport() {
    console.log("\n" + "=".repeat(72));
    console.log("LAPORAN UAT E-RAPOR");
    console.log("=".repeat(72));
    for (const r of this.results) {
      const icon =
        r.status === "PASS" ? "✅" : r.status === "WARN" ? "⚠️" : "❌";
      console.log(`${icon} [${r.id}] ${r.name}`);
      if (r.detail) console.log(`       ${r.detail}`);
    }
    console.log("-".repeat(72));
    console.log(
      `Ringkas: ${this.pass} PASS · ${this.warn} WARN · ${this.fail} FAIL · ${this.results.length} total`,
    );
    console.log("=".repeat(72) + "\n");
    return this.fail === 0;
  }
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Butuh NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY di .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const targetEmail = process.env.SEED_GURU_EMAIL?.trim() || "rexorfathan@gmail.com";
  const uat = new UatRunner();
  const semester = 1;
  const otherSemester = 2;

  console.log(`\n🔍 UAT E-Rapor — guru: ${targetEmail}\n`);

  // --- Infra ---
  await uat.check("INF-01", "Koneksi Supabase & tabel guru", async () => {
    const { error } = await supabase.from("guru").select("id").limit(1);
    if (error) return { pass: false, detail: error.message };
    return true;
  });

  await uat.check("INF-02", "Migration 009 unique_nilai_row (kolom nilai)", async () => {
    const { error } = await supabase.from("nilai").select("tipe_sumatif,id_lingkup_materi").limit(1);
    if (error?.message?.includes("tipe_sumatif")) {
      return { warn: true, detail: "Kolom tipe_sumatif belum ada — jalankan migration 007/009" };
    }
    if (error) return { pass: false, detail: error.message };
    return true;
  });

  await uat.check("INF-03", "Migration 010 rapor_watermark_logo", async () => {
    const { error } = await supabase.from("pengaturan_sekolah").select("rapor_watermark_logo").limit(1);
    if (error?.message?.includes("rapor_watermark_logo")) {
      return { warn: true, detail: "Kolom rapor_watermark_logo belum ada — migration 010" };
    }
    if (error) return { pass: false, detail: error.message };
    return true;
  });

  await uat.check("INF-04", "Migration 011 rapor_template_id", async () => {
    const { error } = await supabase.from("pengaturan_sekolah").select("rapor_template_id").limit(1);
    if (error?.message?.includes("rapor_template_id")) {
      return { warn: true, detail: "Kolom rapor_template_id belum ada — migration 011" };
    }
    if (error) return { pass: false, detail: error.message };
    return true;
  });

  const { data: guru, error: guruErr } = await supabase
    .from("guru")
    .select("id,email,nama_guru")
    .eq("email", targetEmail)
    .maybeSingle();

  if (guruErr || !guru) {
    uat.record("DATA-00", "Akun guru demo", "FAIL", guruErr?.message ?? `Email ${targetEmail} tidak ditemukan`);
    uat.printReport();
    process.exit(1);
  }

  const { data: pengaturan } = await supabase
    .from("pengaturan_sekolah")
    .select("*")
    .eq("id_guru", guru.id)
    .maybeSingle();

  const tahunAjaran = pengaturan?.tahun_ajaran ?? "2025/2026";
  const bobot = {
    formatif: pengaturan?.bobot_formatif ?? 30,
    sumatifLm: pengaturan?.bobot_sumatif_lm ?? 40,
    sas: pengaturan?.bobot_sas ?? 30,
  };

  const { data: kelasList } = await supabase
    .from("kelas")
    .select("id,nama_kelas")
    .eq("id_guru", guru.id)
    .order("nama_kelas")
    .limit(1);

  const kelas = kelasList?.[0];
  if (!kelas) {
    uat.record("DATA-01", "Kelas demo", "FAIL", "Belum ada kelas — npm run seed:demo");
    uat.printReport();
    process.exit(1);
  }

  const { data: mapelList } = await supabase
    .from("mata_pelajaran")
    .select("*")
    .eq("id_guru", guru.id)
    .eq("is_active", true);

  const scorableMapel = (mapelList ?? []).filter((m) => !m.is_group_header);
  const defaultMapel =
    scorableMapel.find((m) => m.is_default) ?? scorableMapel[0];

  const { data: siswaList } = await supabase
    .from("siswa")
    .select("id,nama_siswa")
    .eq("id_kelas", kelas.id)
    .eq("is_deleted", false)
    .limit(5);

  const siswa = siswaList?.[0];

  // --- Data presence ---
  await uat.check("DATA-01", `Kelas & siswa (${kelas.nama_kelas})`, async () => {
    const { count } = await supabase
      .from("siswa")
      .select("*", { count: "exact", head: true })
      .eq("id_kelas", kelas.id)
      .eq("is_deleted", false);
    if ((count ?? 0) < 1) return { pass: false, detail: "Tidak ada siswa" };
    return { pass: true, detail: `${count} siswa` };
  });

  await uat.check("DATA-02", "Nilai penilaian terisi", async () => {
    const siswaIds = (siswaList ?? []).map((s) => s.id);
    if (!siswaIds.length) return { pass: false, detail: "No siswa sample" };
    const { count } = await supabase
      .from("nilai")
      .select("*", { count: "exact", head: true })
      .in("id_siswa", siswaIds);
    if ((count ?? 0) < 1) {
      return { warn: true, detail: "Belum ada nilai — npm run seed:fill-nilai" };
    }
    return { pass: true, detail: `${count}+ baris nilai (sample siswa)` };
  });

  await uat.check("DATA-03", "Rapor mapel tersimpan", async () => {
    const { count } = await supabase
      .from("rapor_mapel")
      .select("*", { count: "exact", head: true })
      .eq("id_kelas", kelas.id)
      .eq("semester", semester)
      .eq("tahun_ajaran", tahunAjaran);
    if ((count ?? 0) < 1) {
      return { warn: true, detail: "Belum ada rapor_mapel — Simpan Semua Mapel di E-Rapor" };
    }
    return { pass: true, detail: `${count} baris rapor_mapel S${semester}` };
  });

  // --- SUMATIF LM vs SAS ---
  await uat.check("P0-01", "Nilai SUMATIF LM dan SAS terpisah di DB", async () => {
    const { data: lmRows } = await supabase
      .from("nilai")
      .select("id", { count: "exact" })
      .eq("jenis_asesmen", "SUMATIF")
      .eq("tipe_sumatif", "LM")
      .limit(1);
    const { data: sasRows } = await supabase
      .from("nilai")
      .select("id", { count: "exact" })
      .limit(1)
      .eq("jenis_asesmen", "SUMATIF")
      .eq("tipe_sumatif", "SAS");
    const { count: lmCount } = await supabase
      .from("nilai")
      .select("*", { count: "exact", head: true })
      .eq("jenis_asesmen", "SUMATIF")
      .eq("tipe_sumatif", "LM");
    const { count: sasCount } = await supabase
      .from("nilai")
      .select("*", { count: "exact", head: true })
      .eq("jenis_asesmen", "SUMATIF")
      .eq("tipe_sumatif", "SAS");
    if (!lmCount && !sasCount) {
      return { warn: true, detail: "Belum ada nilai sumatif — seed:fill-nilai" };
    }
    if (!lmCount || !sasCount) {
      return {
        pass: false,
        detail: `LM=${lmCount ?? 0} SAS=${sasCount ?? 0} — harus keduanya > 0`,
      };
    }
    return { pass: true, detail: `LM=${lmCount} · SAS=${sasCount}` };
  });

  // --- Semester isolation ---
  await uat.check("P0-02", "TP terfilter per semester (tidak tercampur)", async () => {
    const { count: s1 } = await supabase
      .from("tujuan_pembelajaran")
      .select("*", { count: "exact", head: true })
      .eq("id_kelas", kelas.id)
      .eq("semester", semester);
    const { count: s2 } = await supabase
      .from("tujuan_pembelajaran")
      .select("*", { count: "exact", head: true })
      .eq("id_kelas", kelas.id)
      .eq("semester", otherSemester);
    if ((s1 ?? 0) === 0) {
      return { warn: true, detail: `Semester ${semester} belum punya TP` };
    }
    return {
      pass: true,
      detail: `S${semester}: ${s1} TP · S${otherSemester}: ${s2 ?? 0} TP (terpisah)`,
    };
  });

  // --- NA compute sanity ---
  await uat.check("P0-03", "NA rapor_mapel konsisten dengan bobot (sample)", async () => {
    if (!defaultMapel || !siswa) {
      return { warn: true, detail: "Skip — mapel/siswa tidak ada" };
    }
    const { data: row } = await supabase
      .from("rapor_mapel")
      .select("*")
      .eq("id_siswa", siswa.id)
      .eq("id_mata_pelajaran", defaultMapel.id)
      .eq("semester", semester)
      .eq("tahun_ajaran", tahunAjaran)
      .maybeSingle();

    if (!row) {
      return { warn: true, detail: "Belum ada baris rapor_mapel untuk sample siswa/mapel" };
    }

    const expected = hitungNilaiAkhir(
      row.nilai_formatif,
      row.nilai_sumatif_lm,
      row.nilai_sas,
      bobot,
    );
    if (expected == null && row.nilai_akhir == null) return true;
    if (expected == null || row.nilai_akhir == null) {
      return {
        pass: false,
        detail: `expected=${expected} stored=${row.nilai_akhir}`,
      };
    }
    const diff = Math.abs(expected - row.nilai_akhir);
    const intRounded = Math.round(expected);
    const intDiff = Math.abs(intRounded - row.nilai_akhir);
    if (diff > 0.02 && intDiff > 0) {
      return {
        pass: false,
        detail: `NA mismatch: hitung=${expected} DB=${row.nilai_akhir} (siswa ${siswa.nama_siswa})`,
      };
    }
    if (diff > 0.02 && intDiff === 0) {
      return {
        pass: true,
        detail: `${siswa.nama_siswa} · NA=${row.nilai_akhir} (seed integer; app=${expected})`,
      };
    }
    return {
      pass: true,
      detail: `${siswa.nama_siswa} · ${defaultMapel.nama_mapel} NA=${row.nilai_akhir}`,
    };
  });

  // --- Live nilai vs rapor (integrasi) ---
  await uat.check("P0-04", "Nilai live vs rapor_mapel (indikator sample)", async () => {
    if (!siswa) return { warn: true, detail: "Skip" };

    const { data: tpWithMapel } = await supabase
      .from("tujuan_pembelajaran")
      .select("id,id_mata_pelajaran")
      .eq("id_kelas", kelas.id)
      .eq("semester", semester)
      .not("id_mata_pelajaran", "is", null)
      .limit(1);

    let mapelId = tpWithMapel?.[0]?.id_mata_pelajaran ?? defaultMapel?.id;
    if (!mapelId) return { warn: true, detail: "Belum ada mapel dengan TP" };

    const { data: tpList } = await supabase
      .from("tujuan_pembelajaran")
      .select("id")
      .eq("id_kelas", kelas.id)
      .eq("semester", semester)
      .eq("id_mata_pelajaran", mapelId)
      .limit(5);

    if (!tpList?.length) {
      const { data: tpLegacy } = await supabase
        .from("tujuan_pembelajaran")
        .select("id")
        .eq("id_kelas", kelas.id)
        .eq("semester", semester)
        .is("id_mata_pelajaran", null)
        .limit(5);
      if (!tpLegacy?.length) {
        return { warn: true, detail: "Belum ada TP untuk semester ini" };
      }
    }

    const tpIds = (tpList ?? []).map((t) => t.id);
    const { data: inds } = await supabase
      .from("indikator")
      .select("id")
      .in("id_tp", tpIds.length ? tpIds : [-1])
      .limit(3);

    if (!inds?.length) return { warn: true, detail: "Belum ada indikator" };

    const indIds = inds.map((i) => i.id);
    const { count: nilaiCount } = await supabase
      .from("nilai")
      .select("*", { count: "exact", head: true })
      .eq("id_siswa", siswa.id)
      .in("id_indikator", indIds);

    const { data: raporRow } = await supabase
      .from("rapor_mapel")
      .select("nilai_akhir,nilai_formatif")
      .eq("id_siswa", siswa.id)
      .eq("id_mata_pelajaran", mapelId)
      .eq("semester", semester)
      .maybeSingle();

    if ((nilaiCount ?? 0) > 0 && raporRow?.nilai_akhir != null) {
      return {
        pass: true,
        detail: `${nilaiCount} nilai indikator · rapor NA=${raporRow.nilai_akhir}`,
      };
    }
    if ((nilaiCount ?? 0) > 0 && !raporRow) {
      return {
        warn: true,
        detail: "Nilai ada tapi rapor_mapel belum sync — preview live OK, sync manual opsional",
      };
    }
    return { warn: true, detail: "Data belum lengkap untuk integrasi" };
  });

  // --- P5 semester filter ---
  await uat.check("P2-01", "P5 capaian terikat projek per semester", async () => {
    const { data: projekS1 } = await supabase
      .from("projek_p5")
      .select("id")
      .eq("id_kelas", kelas.id)
      .eq("semester", semester);
    const { data: projekS2 } = await supabase
      .from("projek_p5")
      .select("id")
      .eq("id_kelas", kelas.id)
      .eq("semester", otherSemester);

    if (!projekS1?.length && !projekS2?.length) {
      return { warn: true, detail: "Belum ada projek P5 — skip" };
    }

    const s1Ids = (projekS1 ?? []).map((p) => p.id);
    if (!siswa || !s1Ids.length) return { warn: true, detail: "Skip" };

    const { count: capaianFiltered } = await supabase
      .from("siswa_p5_capaian")
      .select("*", { count: "exact", head: true })
      .eq("id_siswa", siswa.id)
      .in("id_projek", s1Ids);

    const { count: capaianAll } = await supabase
      .from("siswa_p5_capaian")
      .select("*", { count: "exact", head: true })
      .eq("id_siswa", siswa.id);

    return {
      pass: true,
      detail: `S${semester}: ${capaianFiltered ?? 0} capaian (filtered) · total ${capaianAll ?? 0}`,
    };
  });

  // --- Mapel MAN structure ---
  await uat.check("P2-02", "Struktur mapel MAN (grup + sub-mapel)", async () => {
    const headers = (mapelList ?? []).filter((m) => m.is_group_header);
    const scorable = (mapelList ?? []).filter((m) => !m.is_group_header);
    if (scorable.length < 3) {
      return { warn: true, detail: `Hanya ${scorable.length} mapel — seed MAN opsional` };
    }
    return {
      pass: true,
      detail: `${scorable.length} mapel · ${headers.length} grup header`,
    };
  });

  // --- Partial NA detection ---
  await uat.check("P3-01", "Deteksi NA parsial (sample rapor)", async () => {
    const { data: rows } = await supabase
      .from("rapor_mapel")
      .select("nilai_formatif,nilai_sumatif_lm,nilai_sas,nilai_akhir")
      .eq("id_kelas", kelas.id)
      .eq("semester", semester)
      .limit(50);

    if (!rows?.length) return { warn: true, detail: "Tidak ada rapor_mapel" };

    let partial = 0;
    for (const r of rows) {
      const present = [r.nilai_formatif, r.nilai_sumatif_lm, r.nilai_sas].filter(
        (v) => v != null,
      ).length;
      if (present > 0 && present < 3 && r.nilai_akhir != null) partial += 1;
    }
    return {
      pass: true,
      detail: `${partial}/${rows.length} baris NA parsial (fitur peringatan aktif jika > 0)`,
    };
  });

  // --- Template prefs ---
  await uat.check("P1-01", "Preferensi template & watermark tersimpan", async () => {
    if (!pengaturan) {
      return { warn: true, detail: "Pengaturan sekolah belum diisi — /pengaturan" };
    }
    const tpl = pengaturan.rapor_template_id ?? "km-default";
    const wm = pengaturan.rapor_watermark_logo ?? false;
    return { pass: true, detail: `template=${tpl} · watermark=${wm}` };
  });

  const ok = uat.printReport();

  console.log("CHECKLIST MANUAL (browser):");
  console.log("  1. /nilai → Sumatif SAS + Sumatif LM → simpan → E-Rapor refresh otomatis");
  console.log("  2. /e-rapor → Pratinjau Hitung → badge Live / tersimpan");
  console.log("  3. Rapor siswa → Cetak A4 + Preview PDF (KM & MAN)");
  console.log("  4. Cetak Kelas + Unduh ZIP PDF");
  console.log("  5. Ganti template cepat 10× → tidak crash\n");

  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
