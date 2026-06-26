/** Naikkan saat mengganti favicon agar browser tidak pakai cache lama. */
export const SITE_ICON_VERSION = "2";

export function siteIconUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${normalized}?v=${SITE_ICON_VERSION}`;
}
