import {
  finalizeRaporTables,
  mountRaporPrintBody,
} from "@/lib/export/rapor/rapor-print-document";
import { RAPOR_MAN_PRINT_DOCUMENT_CSS } from "@/lib/export/rapor/rapor-man-capture-css";
import {
  prepareCloneForWord,
  RAPOR_MAN_WORD_CSS,
} from "@/lib/export/rapor/rapor-word-compat";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildWordDocumentHtml(bodyHtml: string, title: string): string {
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:w="urn:schemas-microsoft-com:office:word"
  xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="E-Rapor">
<title>${escapeHtml(title)}</title>
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument>
</xml>
<![endif]-->
<style>
${RAPOR_MAN_PRINT_DOCUMENT_CSS}
${RAPOR_MAN_WORD_CSS}
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Inline gambar (logo) ke base64 agar Word bisa membuka offline. */
export async function inlineImagesInRoot(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      try {
        const response = await fetch(src, { mode: "cors" });
        if (!response.ok) return;
        const blob = await response.blob();
        img.setAttribute("src", await blobToDataUrl(blob));
      } catch {
        /* biarkan URL asli */
      }
    }),
  );
}

export function raporRootToWordBlob(
  root: HTMLElement,
  filename: string,
  title: string,
): Blob {
  const html = buildWordDocumentHtml(root.outerHTML, title);
  return new Blob(["\ufeff", html], {
    type: "application/msword;charset=utf-8",
  });
}

/**
 * Ekspor Word WYSIWYG dari DOM pratinjau — layout dikonversi ke tabel HTML untuk Word.
 */
export async function buildRaporWordFromDom(
  rootEl: HTMLElement,
  filename: string,
  title: string,
): Promise<{ blob: Blob; filename: string }> {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "rapor-word-export");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    "width:794px",
    "height:1123px",
    "border:0",
    "margin:0",
    "padding:0",
    "opacity:0.01",
    "pointer-events:none",
    "z-index:2147483647",
    "background:#ffffff",
  ].join(";");

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    throw new Error("Iframe export Word tidak tersedia.");
  }

  try {
    const clone = await mountRaporPrintBody(rootEl, doc, { removeWatermark: false });
    finalizeRaporTables(clone);
    prepareCloneForWord(clone);
    await inlineImagesInRoot(clone);
    const blob = raporRootToWordBlob(clone, filename, title);
    return { blob, filename };
  } finally {
    iframe.remove();
  }
}

export function downloadWordBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".doc") ? filename : `${filename}.doc`;
  anchor.click();
  URL.revokeObjectURL(url);
}
