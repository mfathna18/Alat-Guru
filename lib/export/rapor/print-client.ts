/** Deteksi lingkungan cetak mobile — HTML print iframe tidak andal di Android/iOS. */
export function isMobilePrintEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) {
    return true;
  }
  return window.matchMedia("(max-width: 900px) and (pointer: coarse)").matches;
}
