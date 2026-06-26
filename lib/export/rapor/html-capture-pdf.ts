"use client";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import {
  isKmRaporRoot,
  mountKmRaporPrintBody,
} from "@/lib/export/rapor/rapor-km-print-document";
import { clampRaporContentScale } from "@/lib/export/rapor/rapor-content-scale";
import { isMobilePrintEnvironment, openRaporPdfBlob } from "@/lib/export/rapor/print-client";
import type { PrintRaporResult } from "@/lib/export/rapor/print-client";
import { finalizeKmRaporTables } from "@/lib/export/rapor/rapor-km-table-utils";
import {
  A4_HEIGHT_PX,
  A4_WIDTH_PX,
  finalizeRaporTables,
  mountRaporPrintBody,
  waitForImages,
} from "@/lib/export/rapor/rapor-print-document";

export { A4_WIDTH_PX, waitForImages } from "@/lib/export/rapor/rapor-print-document";
export type { PrintRaporResult } from "@/lib/export/rapor/print-client";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
/** Margin selaras @page 5mm — area cetak lebih luas */
const PDF_MARGIN_MM = 5;
const CAPTURE_SCALE = 2;
const MIN_CANVAS_PX = 20;

async function mountIsolatedCaptureFrame(
  rootEl: HTMLElement,
  options: { contentScale?: number } = {},
): Promise<{ iframe: HTMLIFrameElement; pages: HTMLElement[] }> {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "rapor-pdf-capture");
  iframe.setAttribute("aria-hidden", "true");
  // Tetap di viewport — html2canvas Android tidak menangkap iframe di luar layar.
  iframe.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    `width:${A4_WIDTH_PX}px`,
    `height:${A4_HEIGHT_PX * 3}px`,
    "border:0",
    "margin:0",
    "padding:0",
    "opacity:0.01",
    "pointer-events:none",
    "z-index:2147483646",
    "background:#ffffff",
    "overflow:visible",
  ].join(";");

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    throw new Error("Iframe capture rapor tidak tersedia.");
  }

  const mountOptions = {
    removeWatermark: false,
    contentScale: options.contentScale ?? 1,
  };

  await (isKmRaporRoot(rootEl)
    ? mountKmRaporPrintBody(rootEl, doc, mountOptions)
    : mountRaporPrintBody(rootEl, doc, mountOptions));

  const pages = Array.from(
    doc.querySelectorAll<HTMLElement>(".rapor-print-unit, .rapor-print-page"),
  );
  const root = doc.body.firstElementChild as HTMLElement;

  return {
    iframe,
    pages: pages.length > 0 ? pages : root ? [root] : [],
  };
}

async function captureElementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  const root = element.closest("#rapor-print-root") ?? element;
  if (root instanceof HTMLElement && isKmRaporRoot(root)) {
    finalizeKmRaporTables(root);
  } else {
    finalizeRaporTables(root as HTMLElement);
  }

  element.style.width = `${A4_WIDTH_PX}px`;
  element.style.maxWidth = `${A4_WIDTH_PX}px`;
  element.style.overflow = "visible";
  element.style.boxSizing = "border-box";

  const height = Math.max(element.scrollHeight, element.offsetHeight, 1);

  return html2canvas(element, {
    scale: CAPTURE_SCALE,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    imageTimeout: 20_000,
    scrollX: 0,
    scrollY: 0,
    width: A4_WIDTH_PX,
    height,
    onclone: (_doc, clonedEl) => {
      const el = clonedEl as HTMLElement;
      if (el.classList.contains("rapor-km-doc") || el.querySelector(".rapor-km-doc")) {
        finalizeKmRaporTables(el);
      } else {
        finalizeRaporTables(el);
      }
      el.style.overflow = "visible";
    },
  });
}

function appendCanvasFitOnePdfPage(
  doc: jsPDF,
  canvas: HTMLCanvasElement,
  hasExistingPages: boolean,
): { pagesAdded: number; hasPages: boolean } {
  if (canvas.width < MIN_CANVAS_PX || canvas.height < MIN_CANVAS_PX) {
    return { pagesAdded: 0, hasPages: hasExistingPages };
  }

  const maxW = A4_WIDTH_MM - 2 * PDF_MARGIN_MM;
  const maxH = A4_HEIGHT_MM - 2 * PDF_MARGIN_MM;
  const pxToMm = A4_WIDTH_MM / canvas.width;
  const naturalW = A4_WIDTH_MM;
  const naturalH = canvas.height * pxToMm;
  const scale = Math.min(maxW / naturalW, maxH / naturalH, 1);
  const drawW = naturalW * scale;
  const drawH = naturalH * scale;
  const x = (A4_WIDTH_MM - drawW) / 2;
  const y = PDF_MARGIN_MM;

  let hasPages = hasExistingPages;
  if (hasPages) doc.addPage();
  else hasPages = true;

  doc.addImage(
    canvas.toDataURL("image/jpeg", 0.92),
    "JPEG",
    x,
    y,
    drawW,
    drawH,
    undefined,
    "FAST",
  );

  return { pagesAdded: 1, hasPages };
}

function appendCanvasToPdf(
  doc: jsPDF,
  canvas: HTMLCanvasElement,
  hasExistingPages: boolean,
): { pagesAdded: number; hasPages: boolean } {
  if (canvas.width < MIN_CANVAS_PX || canvas.height < MIN_CANVAS_PX) {
    return { pagesAdded: 0, hasPages: hasExistingPages };
  }

  const pxToMm = A4_WIDTH_MM / canvas.width;
  const imgWidthMm = A4_WIDTH_MM;

  const maxW = A4_WIDTH_MM - 2 * PDF_MARGIN_MM;
  const maxH = A4_HEIGHT_MM - 2 * PDF_MARGIN_MM;

  const pageHeightPx = maxH / pxToMm;

  let offsetY = 0;
  let pagesAdded = 0;
  let hasPages = hasExistingPages;

  while (offsetY < canvas.height - 1) {
    if (hasPages) doc.addPage();
    else hasPages = true;

    const remainingPx = canvas.height - offsetY;
    const slicePx = Math.min(pageHeightPx, remainingPx);
    const sliceHeightMm = slicePx * pxToMm;

    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = Math.ceil(slicePx);
    const ctx = sliceCanvas.getContext("2d");
    if (!ctx) break;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(
      canvas,
      0,
      offsetY,
      canvas.width,
      slicePx,
      0,
      0,
      canvas.width,
      slicePx,
    );

    const scale = Math.min(maxW / imgWidthMm, 1);
    const drawW = imgWidthMm * scale;
    const drawH = sliceHeightMm * scale;
    const x = (A4_WIDTH_MM - drawW) / 2;
    const y = PDF_MARGIN_MM;

    doc.addImage(
      sliceCanvas.toDataURL("image/jpeg", 0.94),
      "JPEG",
      x,
      y,
      drawW,
      drawH,
      undefined,
      "FAST",
    );

    offsetY += slicePx;
    pagesAdded += 1;
  }

  return { pagesAdded, hasPages };
}

export async function captureRaporDomToPdf(
  rootEl: HTMLElement,
  filename: string,
  options: { contentScale?: number } = {},
): Promise<{ blob: Blob; filename: string }> {
  const { iframe, pages } = await mountIsolatedCaptureFrame(rootEl, options);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  try {
    let totalPages = 0;
    let hasPdfPages = false;

    await new Promise((r) => setTimeout(r, 250));

    for (let i = 0; i < pages.length; i += 1) {
      const page = pages[i]!;
      const canvas = await captureElementToCanvas(page);
      const result = appendCanvasFitOnePdfPage(doc, canvas, hasPdfPages);
      hasPdfPages = result.hasPages;
      totalPages += result.pagesAdded;
    }

    if (totalPages === 0) {
      throw new Error("Capture PDF gagal — coba gunakan tombol Cetak.");
    }

    return { blob: doc.output("blob"), filename };
  } finally {
    iframe.remove();
  }
}

/** Gaya iframe cetak — lebar A4 penuh, di luar layar agar mobile tidak memotong. */
function buildPrintIframeStyle(): string {
  return [
    "position:fixed",
    "left:-10000px",
    "top:0",
    `width:${A4_WIDTH_PX}px`,
    `height:${A4_HEIGHT_PX * 4}px`,
    "border:0",
    "margin:0",
    "padding:0",
    "opacity:0",
    "pointer-events:none",
    "z-index:-1",
    "background:#ffffff",
    "overflow:visible",
  ].join(";");
}

/** Mobile: buka PDF di tab baru — jangan print() dari iframe (preview kosong di Android). */
async function printRaporOnMobile(
  rootEl: HTMLElement,
  options: { contentScale?: number } = {},
): Promise<PrintRaporResult> {
  const { blob } = await captureRaporDomToPdf(rootEl, "rapor.pdf", {
    contentScale: 1,
    ...options,
  });
  return openRaporPdfBlob(blob, "rapor.pdf");
}

/** Cetak rapor via iframe tersembunyi (desktop) atau PDF tab baru (mobile). */
export async function printRaporElement(
  rootEl: HTMLElement,
  options: { contentScale?: number } = {},
): Promise<PrintRaporResult> {
  if (isMobilePrintEnvironment()) {
    return printRaporOnMobile(rootEl, options);
  }
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "rapor-print");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = buildPrintIframeStyle();

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    throw new Error("Cetak rapor tidak tersedia.");
  }

  const contentScale =
    options.contentScale != null
      ? clampRaporContentScale(options.contentScale)
      : undefined;

  try {
    await (isKmRaporRoot(rootEl)
      ? mountKmRaporPrintBody(rootEl, doc, {
          removeWatermark: false,
          contentScale,
        })
      : mountRaporPrintBody(rootEl, doc, {
          removeWatermark: false,
          contentScale,
        }));

    const win = iframe.contentWindow;
    if (!win) {
      throw new Error("Cetak rapor tidak tersedia.");
    }

    await new Promise<void>((resolve, reject) => {
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        iframe.remove();
        resolve();
      };

      win.onafterprint = finish;
      window.setTimeout(finish, 120_000);

      try {
        win.focus();
        win.print();
      } catch (err) {
        iframe.remove();
        reject(err instanceof Error ? err : new Error("Gagal membuka dialog cetak."));
      }
    });
    return { mode: "dialog" };
  } catch (err) {
    iframe.remove();
    throw err instanceof Error ? err : new Error("Gagal mencetak rapor.");
  }
}

/** @deprecated Gunakan printRaporElement(rootEl). */
export function printRaporInPage(): void {
  throw new Error("printRaporInPage membutuhkan elemen rapor — gunakan printRaporElement.");
}

/** @deprecated Gunakan printRaporElement. */
export async function openRaporPrintWindow(
  rootEl: HTMLElement,
  options: { contentScale?: number } = {},
): Promise<void> {
  await printRaporElement(rootEl, options);
}
