import { GState, type jsPDF } from "jspdf";

export async function fetchImageBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function imageFormatFromDataUrl(dataUrl: string): "PNG" | "JPEG" | "WEBP" {
  if (dataUrl.includes("image/jpeg") || dataUrl.includes("image/jpg")) {
    return "JPEG";
  }
  if (dataUrl.includes("image/webp")) return "WEBP";
  return "PNG";
}

/** Logo transparan di tengah setiap halaman PDF. */
export function addLogoWatermarkToPdf(
  doc: jsPDF,
  logoDataUrl: string,
  opacity = 0.07,
  sizeMm = 90,
): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const x = (pageWidth - sizeMm) / 2;
  const y = (pageHeight - sizeMm) / 2;
  const format = imageFormatFromDataUrl(logoDataUrl);

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.saveGraphicsState();
    doc.setGState(new GState({ opacity }));
    doc.addImage(logoDataUrl, format, x, y, sizeMm, sizeMm, undefined, "FAST");
    doc.restoreGraphicsState();
  }
}
