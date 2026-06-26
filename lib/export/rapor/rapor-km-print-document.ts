import { RAPOR_KM_PRINT_DOCUMENT_CSS } from "@/lib/export/rapor/rapor-km-capture-css";
import { fitAllRaporPrintUnits } from "@/lib/export/rapor/rapor-content-scale";
import {
  cloneRaporRoot,
  pinRaporPrintDocumentWidth,
  RAPOR_PRINT_HEAD_META,
  waitForImages,
} from "@/lib/export/rapor/rapor-print-document";

export { finalizeKmRaporTables, KM_COL_WIDTH_RATIO } from "@/lib/export/rapor/rapor-km-table-utils";

/** CSS iframe cetak/capture KM (bukan MAN). */
export function writeKmPrintDocumentShell(doc: Document): void {
  doc.open();
  doc.write(
    `<!DOCTYPE html><html lang="id"><head>${RAPOR_PRINT_HEAD_META}<title>Rapor</title><style>${RAPOR_KM_PRINT_DOCUMENT_CSS}</style></head><body></body></html>`,
  );
  doc.close();
  doc.body.style.margin = "0";
  doc.body.style.padding = "0";
  doc.body.style.background = "#ffffff";
  doc.body.style.display = "block";
  doc.body.style.height = "auto";
}

export async function mountKmRaporPrintBody(
  rootEl: HTMLElement,
  doc: Document,
  options: { removeWatermark?: boolean; contentScale?: number } = {},
): Promise<HTMLElement> {
  writeKmPrintDocumentShell(doc);

  const clone = cloneRaporRoot(rootEl, {
    stripInlineStyles: true,
    removeWatermark: options.removeWatermark ?? false,
  });

  if (clone.classList.contains("rapor-km-doc")) {
    clone.classList.add("rapor-km-compact");
  }

  doc.body.appendChild(clone);
  pinRaporPrintDocumentWidth(doc, clone);
  await waitForImages(doc);
  await new Promise((r) => setTimeout(r, 150));
  void clone.offsetHeight;

  const { finalizeKmRaporTables } = await import("@/lib/export/rapor/rapor-km-table-utils");
  finalizeKmRaporTables(clone);

  const userScale = options.contentScale ?? 1;
  fitAllRaporPrintUnits(clone, userScale);

  await new Promise((r) => requestAnimationFrame(r));
  return clone;
}

export function isKmRaporRoot(root: HTMLElement): boolean {
  if (root.classList.contains("rapor-km-doc")) return true;
  return root.querySelector(".rapor-km-doc") !== null;
}
