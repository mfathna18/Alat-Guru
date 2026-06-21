"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Check,
  ImagePlus,
  Loader2,
  Save,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { useViewportMode } from "@/hooks/use-viewport-mode";
import { DEFAULT_KKM } from "@/lib/nilai/kkm-config";
import { DEFAULT_KOP_INSTANSI } from "@/lib/rapor/kop-instansi";
import { SignatureUploadField } from "@/components/pengaturan/signature-upload-field";
import { PengaturanMapelCard } from "@/components/pengaturan/pengaturan-mapel-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSeedJenjangMapel } from "@/lib/hooks/use-mata-pelajaran";
import {
  JENJANG_SEKOLAH_LABEL,
  JENJANG_SEKOLAH_OPTIONS,
  isJenjangSekolah,
} from "@/lib/mapel/jenjang-mapel-seed";
import {
  usePengaturanSekolah,
  useSavePengaturan,
  useUploadLogo,
  useUploadTtd,
  useClearTtd,
} from "@/lib/hooks/use-pengaturan";
import { fetchCurrentGuru } from "@/lib/services/kelas";
import {
  getDefaultTahunAjaran,
  validateTahunAjaran,
} from "@/lib/services/pengaturan";
import type { SkorHuruf, JenjangSekolah } from "@/lib/types/database";
import { HURUF_OPTIONS } from "@/lib/nilai/skala-huruf";
import { cn } from "@/lib/utils";

export function PengaturanManager() {
  const router = useRouter();
  const mode = useViewportMode();
  const isMobile = mode === "mobile";

  const { data: guru, isLoading: loadingGuru } = useQuery({
    queryKey: ["guru", "current"],
    queryFn: fetchCurrentGuru,
  });

  const { data: pengaturan, isLoading: loadingPengaturan } =
    usePengaturanSekolah(guru?.id);

  const savePengaturan = useSavePengaturan(guru?.id);
  const seedJenjangMapel = useSeedJenjangMapel();
  const uploadLogo = useUploadLogo();
  const uploadTtd = useUploadTtd(guru?.id);
  const clearTtd = useClearTtd(guru?.id);

  const [namaSekolah, setNamaSekolah] = React.useState("");
  const [jenjang, setJenjang] = React.useState<JenjangSekolah | "">("");
  const [seedPromptJenjang, setSeedPromptJenjang] =
    React.useState<JenjangSekolah | null>(null);
  const [kopInstansi, setKopInstansi] = React.useState(DEFAULT_KOP_INSTANSI);
  const [tahunAjaran, setTahunAjaran] = React.useState(getDefaultTahunAjaran());
  const [namaWaliKelas, setNamaWaliKelas] = React.useState("");
  const [nipWaliKelas, setNipWaliKelas] = React.useState("");
  const [ttdWaliUrl, setTtdWaliUrl] = React.useState<string | null>(null);
  const [ttdWaliPreview, setTtdWaliPreview] = React.useState<string | null>(null);
  const [namaKepsek, setNamaKepsek] = React.useState("");
  const [nipKepsek, setNipKepsek] = React.useState("");
  const [ttdKepsekUrl, setTtdKepsekUrl] = React.useState<string | null>(null);
  const [ttdKepsekPreview, setTtdKepsekPreview] = React.useState<string | null>(null);
  const [kkmAngka, setKkmAngka] = React.useState(DEFAULT_KKM.kkmAngka);
  const [ambangPengayaan, setAmbangPengayaan] = React.useState(
    DEFAULT_KKM.ambangPengayaanAngka,
  );
  const [kkmHuruf, setKkmHuruf] = React.useState<SkorHuruf>(
    DEFAULT_KKM.kkmHuruf,
  );
  const [ambangPengayaanHuruf, setAmbangPengayaanHuruf] =
    React.useState<SkorHuruf>(DEFAULT_KKM.ambangPengayaanHuruf);
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [raporWatermarkLogo, setRaporWatermarkLogo] = React.useState(false);
  const [savedFlash, setSavedFlash] = React.useState(false);

  const fileRef = React.useRef<HTMLInputElement>(null);
  const hydrated = React.useRef(false);

  React.useEffect(() => {
    if (loadingPengaturan || !guru) return;

    if (pengaturan && !hydrated.current) {
      setNamaSekolah(pengaturan.nama_sekolah);
      setJenjang(pengaturan.jenjang ?? "");
      setKopInstansi(pengaturan.kop_instansi?.trim() || DEFAULT_KOP_INSTANSI);
      setTahunAjaran(pengaturan.tahun_ajaran);
      setNamaWaliKelas(
        pengaturan.nama_wali_kelas?.trim() || guru.nama_guru || "",
      );
      setNipWaliKelas(pengaturan.nip_wali_kelas?.trim() || guru.nip_guru || "");
      setTtdWaliUrl(pengaturan.ttd_wali_kelas_url ?? null);
      setTtdWaliPreview(pengaturan.ttd_wali_kelas_url ?? null);
      setNamaKepsek(pengaturan.nama_kepsek);
      setNipKepsek(pengaturan.nip_kepsek);
      setTtdKepsekUrl(pengaturan.ttd_kepsek_url ?? null);
      setTtdKepsekPreview(pengaturan.ttd_kepsek_url ?? null);
      setKkmAngka(pengaturan.kkm_angka ?? DEFAULT_KKM.kkmAngka);
      setAmbangPengayaan(
        pengaturan.ambang_pengayaan_angka ?? DEFAULT_KKM.ambangPengayaanAngka,
      );
      setKkmHuruf(pengaturan.kkm_kualitatif ?? DEFAULT_KKM.kkmHuruf);
      setAmbangPengayaanHuruf(
        pengaturan.ambang_pengayaan_kualitatif ??
          DEFAULT_KKM.ambangPengayaanHuruf,
      );
      setLogoUrl(pengaturan.logo_url);
      setLogoPreview(pengaturan.logo_url);
      setRaporWatermarkLogo(pengaturan.rapor_watermark_logo ?? false);
      hydrated.current = true;
      return;
    }

    if (!pengaturan && !hydrated.current) {
      setNamaWaliKelas(guru.nama_guru);
      setNipWaliKelas(guru.nip_guru ?? "");
      hydrated.current = true;
    }
  }, [pengaturan, guru, loadingPengaturan]);

  React.useEffect(() => {
    if (!pengaturan || uploadTtd.isPending || clearTtd.isPending) return;
    setTtdWaliUrl(pengaturan.ttd_wali_kelas_url ?? null);
    setTtdWaliPreview(pengaturan.ttd_wali_kelas_url ?? null);
    setTtdKepsekUrl(pengaturan.ttd_kepsek_url ?? null);
    setTtdKepsekPreview(pengaturan.ttd_kepsek_url ?? null);
  }, [
    pengaturan?.ttd_wali_kelas_url,
    pengaturan?.ttd_kepsek_url,
    uploadTtd.isPending,
    clearTtd.isPending,
  ]);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !guru) return;

    const localUrl = URL.createObjectURL(file);
    setLogoPreview(localUrl);

    try {
      const publicUrl = await uploadLogo.mutateAsync({ file, guruId: guru.id });
      setLogoUrl(publicUrl);
      setLogoPreview(publicUrl);
      toast.success("Logo berhasil diunggah");
    } catch (err) {
      setLogoPreview(logoUrl);
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah logo");
    } finally {
      URL.revokeObjectURL(localUrl);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleTtdUpload(
    role: "wali-kelas" | "kepsek",
    file: File,
  ) {
    if (!guru) return;

    const localUrl = URL.createObjectURL(file);
    if (role === "wali-kelas") setTtdWaliPreview(localUrl);
    else setTtdKepsekPreview(localUrl);

    try {
      const { url: publicUrl } = await uploadTtd.mutateAsync({
        file,
        guruId: guru.id,
        role,
      });
      if (role === "wali-kelas") {
        setTtdWaliUrl(publicUrl);
        setTtdWaliPreview(publicUrl);
      } else {
        setTtdKepsekUrl(publicUrl);
        setTtdKepsekPreview(publicUrl);
      }
      toast.success("Tanda tangan tersimpan");
    } catch (err) {
      if (role === "wali-kelas") setTtdWaliPreview(ttdWaliUrl);
      else setTtdKepsekPreview(ttdKepsekUrl);
      toast.error(
        err instanceof Error ? err.message : "Gagal mengunggah tanda tangan",
      );
    } finally {
      URL.revokeObjectURL(localUrl);
    }
  }

  async function handleTtdClear(role: "wali-kelas" | "kepsek") {
    try {
      await clearTtd.mutateAsync(role);
      if (role === "wali-kelas") {
        setTtdWaliUrl(null);
        setTtdWaliPreview(null);
      } else {
        setTtdKepsekUrl(null);
        setTtdKepsekPreview(null);
      }
      toast.success("Tanda tangan dihapus");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus tanda tangan");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jenjang) {
      toast.error("Pilih jenjang sekolah terlebih dahulu.");
      return;
    }
    if (!validateTahunAjaran(tahunAjaran)) {
      toast.error("Tahun ajaran harus format 2025/2026");
      return;
    }
    if (ambangPengayaan <= kkmAngka) {
      toast.error("Ambang pengayaan harus lebih tinggi dari KKM.");
      return;
    }

    try {
      const saved = await savePengaturan.mutateAsync({
        nama_sekolah: namaSekolah,
        jenjang,
        kop_instansi: kopInstansi.trim() || null,
        tahun_ajaran: tahunAjaran,
        nama_kepsek: namaKepsek,
        nip_kepsek: nipKepsek,
        nama_wali_kelas: namaWaliKelas.trim() || null,
        nip_wali_kelas: nipWaliKelas.trim() || null,
        ttd_wali_kelas_url: ttdWaliUrl,
        ttd_kepsek_url: ttdKepsekUrl,
        logo_url: logoUrl,
        kkm_angka: kkmAngka,
        ambang_pengayaan_angka: ambangPengayaan,
        kkm_kualitatif: kkmHuruf,
        ambang_pengayaan_kualitatif: ambangPengayaanHuruf,
        rapor_watermark_logo: raporWatermarkLogo,
      });
      const waliNama =
        saved.nama_wali_kelas?.trim() || guru?.nama_guru || "";
      const waliNip =
        saved.nip_wali_kelas?.trim() || guru?.nip_guru || "";
      setNamaWaliKelas(waliNama);
      setNipWaliKelas(waliNip);
      toast.success("Pengaturan sekolah disimpan");
      setSavedFlash(true);
      router.refresh();
      window.setTimeout(() => setSavedFlash(false), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    }
  }

  function handleJenjangChange(value: string) {
    if (!isJenjangSekolah(value)) {
      setJenjang("");
      return;
    }
    const prev = jenjang;
    setJenjang(value);
    if (value !== prev) {
      setSeedPromptJenjang(value);
    }
  }

  async function confirmSeedJenjang() {
    if (!seedPromptJenjang) return;
    try {
      const count = await seedJenjangMapel.mutateAsync(seedPromptJenjang);
      if (count === 0) {
        toast.info("Semua mapel default jenjang ini sudah ada.");
      } else {
        toast.success(
          `${count} mapel ditambahkan untuk ${JENJANG_SEKOLAH_LABEL[seedPromptJenjang]}.`,
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memuat mapel.");
    } finally {
      setSeedPromptJenjang(null);
    }
  }

  const loading = loadingGuru || loadingPengaturan;
  const saving = savePengaturan.isPending;
  const uploading = uploadLogo.isPending || uploadTtd.isPending || clearTtd.isPending;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">
          Pengaturan Sekolah
        </h1>
        <p className="text-sm text-muted-foreground">
          Atur profil sekolah, logo, tanda tangan, dan daftar mata pelajaran.
        </p>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" />
          Memuat pengaturan…
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-6",
            isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-5",
          )}
        >
          <form
            onSubmit={handleSubmit}
            className={cn("space-y-6", !isMobile && "lg:col-span-3")}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="size-4" />
                  Identitas Sekolah
                </CardTitle>
                <CardDescription>
                  Informasi yang muncul di kop surat dan dokumen Kurikulum
                  Merdeka.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nama-sekolah">Nama Sekolah</Label>
                  <Input
                    id="nama-sekolah"
                    className="min-h-11"
                    placeholder="SD Negeri 1 Contoh"
                    value={namaSekolah}
                    onChange={(e) => setNamaSekolah(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jenjang-sekolah">Jenjang Sekolah</Label>
                  <select
                    id="jenjang-sekolah"
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={jenjang}
                    required
                    onChange={(e) => handleJenjangChange(e.target.value)}
                  >
                    <option value="">— Pilih jenjang —</option>
                    {JENJANG_SEKOLAH_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Saat jenjang dipilih, Anda dapat memuat daftar mapel default
                    jenjang tersebut. Mapel tetap bisa diedit, ditambah, atau
                    dihapus.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kop-instansi">Baris Instansi (Kop Surat)</Label>
                  <Input
                    id="kop-instansi"
                    className="min-h-11"
                    placeholder={DEFAULT_KOP_INSTANSI}
                    value={kopInstansi}
                    onChange={(e) => setKopInstansi(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Teks di atas nama sekolah pada kop dokumen dan rapor KM.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tahun-ajaran">Tahun Ajaran</Label>
                  <Input
                    id="tahun-ajaran"
                    className="min-h-11"
                    placeholder="2025/2026"
                    pattern="\d{4}/\d{4}"
                    value={tahunAjaran}
                    onChange={(e) => setTahunAjaran(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: 2025/2026
                  </p>
                </div>
              </CardContent>
            </Card>

            <PengaturanMapelCard jenjang={jenjang} />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Logo Sekolah</CardTitle>
                <CardDescription>
                  Disimpan di Supabase Storage — bucket{" "}
                  <code className="text-xs">logo-sekolah</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/30">
                    {logoPreview ? (
                      <Image
                        src={logoPreview}
                        alt="Logo sekolah"
                        width={96}
                        height={96}
                        className="size-full object-contain p-1"
                        unoptimized
                      />
                    ) : (
                      <Building2 className="size-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="sr-only"
                      onChange={handleLogoChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11"
                      disabled={uploading}
                      onClick={() => fileRef.current?.click()}
                    >
                      {uploading ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <ImagePlus className="mr-2 size-4" />
                      )}
                      {logoPreview ? "Ganti Logo" : "Unggah Logo"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      PNG/JPG/WEBP, maks. 2 MB
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                  <p className="text-sm font-medium">E-Rapor — watermark logo</p>
                  <p className="text-xs text-muted-foreground">
                    Logo transparan di latar belakang rapor (bisa diubah per
                    cetak di halaman E-Rapor).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={raporWatermarkLogo ? "default" : "outline"}
                      className="min-h-9"
                      disabled={!logoPreview}
                      onClick={() => setRaporWatermarkLogo(true)}
                    >
                      Aktifkan
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={!raporWatermarkLogo ? "default" : "outline"}
                      className="min-h-9"
                      onClick={() => setRaporWatermarkLogo(false)}
                    >
                      Nonaktifkan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kriteria Ketuntasan (KKM)</CardTitle>
                <CardDescription>
                  Dasar pemisahan otomatis daftar Remedial &amp; Pengayaan di
                  menu Penilaian.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="kkm-angka">KKM (skala angka 0–100)</Label>
                    <Input
                      id="kkm-angka"
                      type="number"
                      min={1}
                      max={100}
                      className="min-h-11"
                      value={kkmAngka}
                      onChange={(e) => setKkmAngka(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ambang-pengayaan">
                      Ambang Pengayaan (angka)
                    </Label>
                    <Input
                      id="ambang-pengayaan"
                      type="number"
                      min={1}
                      max={100}
                      className="min-h-11"
                      value={ambangPengayaan}
                      onChange={(e) =>
                        setAmbangPengayaan(Number(e.target.value))
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>KKM (skala huruf A–E)</Label>
                    <div className="flex flex-wrap gap-2">
                      {HURUF_OPTIONS.map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant={kkmHuruf === v ? "default" : "outline"}
                          onClick={() => setKkmHuruf(v)}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Ambang Pengayaan (huruf)</Label>
                    <div className="flex flex-wrap gap-2">
                      {HURUF_OPTIONS.map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant={
                            ambangPengayaanHuruf === v ? "default" : "outline"
                          }
                          onClick={() => setAmbangPengayaanHuruf(v)}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Siswa dengan nilai sumatif &lt; KKM masuk daftar Remedial.
                  Siswa dengan semua indikator &gt; ambang pengayaan masuk daftar
                  Pengayaan.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Wali Kelas</CardTitle>
                <CardDescription>
                  Nama dan tanda tangan wali kelas pada blok legalitas rapor.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nama-wali-kelas">Nama Wali Kelas</Label>
                  <Input
                    id="nama-wali-kelas"
                    className="min-h-11"
                    placeholder="Budi Santoso, S.Pd."
                    value={namaWaliKelas}
                    onChange={(e) => setNamaWaliKelas(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nip-wali-kelas">NIP Wali Kelas (opsional)</Label>
                  <Input
                    id="nip-wali-kelas"
                    className="min-h-11"
                    placeholder="196501011990031001"
                    value={nipWaliKelas}
                    onChange={(e) => setNipWaliKelas(e.target.value)}
                  />
                </div>
                <SignatureUploadField
                  id="ttd-wali-kelas"
                  label="Tanda Tangan Wali Kelas"
                  previewUrl={ttdWaliPreview}
                  uploading={uploadTtd.isPending || clearTtd.isPending}
                  onUpload={(file) => handleTtdUpload("wali-kelas", file)}
                  onClear={() => handleTtdClear("wali-kelas")}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kepala Sekolah</CardTitle>
                <CardDescription>
                  Untuk blok tanda tangan legalitas dokumen cetak.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nama-kepsek">Nama Kepala Sekolah</Label>
                  <Input
                    id="nama-kepsek"
                    className="min-h-11"
                    placeholder="Dra. Siti Rahayu, M.Pd."
                    value={namaKepsek}
                    onChange={(e) => setNamaKepsek(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nip-kepsek">NIP Kepala Sekolah</Label>
                  <Input
                    id="nip-kepsek"
                    className="min-h-11"
                    placeholder="196501011990031001"
                    value={nipKepsek}
                    onChange={(e) => setNipKepsek(e.target.value)}
                    required
                  />
                </div>
                <SignatureUploadField
                  id="ttd-kepsek"
                  label="Tanda Tangan Kepala Sekolah"
                  previewUrl={ttdKepsekPreview}
                  uploading={uploadTtd.isPending || clearTtd.isPending}
                  onUpload={(file) => handleTtdUpload("kepsek", file)}
                  onClear={() => handleTtdClear("kepsek")}
                />
              </CardContent>
            </Card>

            <Button
              type="submit"
              disabled={saving}
              className={cn("min-h-11", isMobile ? "w-full" : "min-w-[160px]")}
            >
              {saving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : savedFlash ? (
                <Check className="mr-2 size-4 text-emerald-500" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              Simpan Pengaturan
            </Button>
          </form>

          <div className={cn(!isMobile && "lg:col-span-2")}>
            <Card className="sticky top-4 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base">Pratinjau Kop Dokumen</CardTitle>
                <CardDescription>
                  Zero Redundancy — data ini mengalir ke seluruh output cetak.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentPreview
                  kopInstansi={kopInstansi.trim() || DEFAULT_KOP_INSTANSI}
                  namaSekolah={namaSekolah || "Nama Sekolah"}
                  tahunAjaran={tahunAjaran || "—/—"}
                  namaKepsek={namaKepsek || "Nama Kepala Sekolah"}
                  nipKepsek={nipKepsek || "—"}
                  logoUrl={logoPreview}
                  guruNama={guru?.nama_guru}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <AlertDialog
        open={seedPromptJenjang != null}
        onOpenChange={(open) => !open && setSeedPromptJenjang(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Muat mapel default jenjang?</AlertDialogTitle>
            <AlertDialogDescription>
              {seedPromptJenjang
                ? `Tambahkan mapel inti untuk ${JENJANG_SEKOLAH_LABEL[seedPromptJenjang]}? Mapel yang sudah ada tidak dihapus — hanya mapel baru yang belum terdaftar.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={seedJenjangMapel.isPending}>
              Nanti saja
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={seedJenjangMapel.isPending}
              onClick={(e) => {
                e.preventDefault();
                void confirmSeedJenjang();
              }}
            >
              {seedJenjangMapel.isPending ? "Memuat…" : "Muat mapel default"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DocumentPreview({
  kopInstansi,
  namaSekolah,
  tahunAjaran,
  namaKepsek,
  nipKepsek,
  logoUrl,
  guruNama,
}: {
  kopInstansi: string;
  namaSekolah: string;
  tahunAjaran: string;
  namaKepsek: string;
  nipKepsek: string;
  logoUrl: string | null;
  guruNama?: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-4 text-black shadow-inner dark:bg-zinc-50">
      <div className="flex items-center gap-3 border-b border-black/10 pb-3">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded border border-black/10 bg-white">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt=""
              width={56}
              height={56}
              className="size-full object-contain p-0.5"
              unoptimized
            />
          ) : (
            <Building2 className="size-6 text-black/30" />
          )}
        </div>
        <div className="min-w-0 text-center flex-1">
          <p className="text-[10px] uppercase tracking-wide text-black/60">
            {kopInstansi}
          </p>
          <p className="text-sm font-bold uppercase leading-tight">
            {namaSekolah}
          </p>
          <Badge
            variant="outline"
            className="mt-1 border-black/20 text-[10px] text-black"
          >
            TA {tahunAjaran}
          </Badge>
        </div>
      </div>

      <div className="mt-4 space-y-1 text-center text-xs text-black/70">
        <p className="font-medium text-black/90">REKAP PENILAIAN SISWA</p>
        {guruNama && (
          <p className="text-[10px]">Guru: {guruNama}</p>
        )}
      </div>

      <Separator className="my-4 bg-black/10" />

      <div className="text-right text-[10px] leading-relaxed text-black/80">
        <p className="mb-8">Mengetahui,</p>
        <p className="font-semibold">{namaKepsek}</p>
        <p>NIP. {nipKepsek}</p>
        <p className="mt-0.5 text-black/50">Kepala Sekolah</p>
      </div>
    </div>
  );
}
