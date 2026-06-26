/** Deteksi lingkungan cetak mobile — HTML print iframe tidak andal di Android/iOS. */
export function isMobilePrintEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) {
    return true;
  }
  return window.matchMedia("(max-width: 900px) and (pointer: coarse)").matches;
}

export type PrintRaporMode = "dialog" | "pdf-tab";

export interface PrintRaporResult {
  mode: PrintRaporMode;
  /** PDF diunduh karena popup diblokir. */
  downloaded?: boolean;
}

/** Buka blob PDF di tab baru (Android) atau unduh sebagai fallback. */
export function openRaporPdfBlob(blob: Blob, filename = "rapor.pdf"): PrintRaporResult {
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");

  if (!opened) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return { mode: "pdf-tab", downloaded: true };
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 300_000);
  return { mode: "pdf-tab", downloaded: false };
}
