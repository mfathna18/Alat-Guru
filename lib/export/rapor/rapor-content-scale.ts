/** Skala isi rapor (bukan ukuran kertas A4). 1 = 100%. */
export const RAPOR_CONTENT_SCALE_MIN = 0.5;
export const RAPOR_CONTENT_SCALE_MAX = 1.5;

export function clampRaporContentScale(scale: number): number {
  if (!Number.isFinite(scale)) return 1;
  return Math.min(
    RAPOR_CONTENT_SCALE_MAX,
    Math.max(RAPOR_CONTENT_SCALE_MIN, scale),
  );
}

export function percentToRaporContentScale(percent: number): number {
  return clampRaporContentScale(percent / 100);
}

/** Tinggi/lebar area cetak A4 setelah margin @page 5mm (mm). */
export const A4_PRINTABLE_HEIGHT_MM = 287;
export const A4_PRINTABLE_WIDTH_MM = 200;

const MM_TO_PX = 96 / 25.4;

/** CSS skala isi — pratinjau layar (transform tidak mempengaruhi layout cetak). */
export const RAPOR_CONTENT_SCALE_CSS = `
.rapor-content-scale-outer {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.rapor-content-inner {
  flex: 0 0 100%;
  width: 100%;
  max-width: 210mm;
  margin: 0 auto;
  transform: scale(var(--rapor-content-scale, 1));
  transform-origin: top center;
}
`;

/** CSS skala isi — iframe cetak/PDF (zoom menyusut layout, aman untuk paginasi). */
export const RAPOR_PRINT_CONTENT_SCALE_CSS = `
.rapor-content-scale-outer {
  width: 100%;
  display: block;
  margin: 0 auto;
  text-align: left;
}

.rapor-content-inner {
  display: block;
  width: 100%;
  max-width: 210mm;
  margin: 0 auto;
  text-align: left;
  transform: scale(var(--rapor-content-scale, 1));
  transform-origin: top left;
  zoom: 1;
}
`;

/** CSS unit cetak — pemisah halaman & isolasi pengecilan per lembar. */
export const RAPOR_PRINT_UNIT_CSS = `
.rapor-print-unit {
  display: block;
  width: 210mm;
  max-width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  page-break-inside: avoid;
  break-inside: avoid;
}

.rapor-pages > .rapor-print-unit:not(:last-child) {
  page-break-after: always;
  break-after: page;
}

.rapor-pages > .rapor-print-unit:last-child {
  page-break-after: auto;
  break-after: auto;
}

.rapor-bulk-student:not(:last-child) .rapor-pages > .rapor-print-unit:last-child {
  page-break-after: always;
  break-after: page;
}

#rapor-print-root > .rapor-bulk-student:not(:last-child) {
  page-break-after: always;
  break-after: page;
}

#rapor-print-root > .rapor-bulk-student:last-child {
  page-break-after: auto;
  break-after: auto;
}
`;

export function applyRaporContentScale(root: HTMLElement, scale: number): void {
  const normalized = clampRaporContentScale(scale);
  root.style.setProperty("--rapor-content-scale", String(normalized));

  root
    .querySelectorAll<HTMLElement>(".rapor-content-scale-outer, .rapor-content-inner")
    .forEach((el) => {
      el.style.setProperty("--rapor-content-scale", String(normalized));
    });
}

/** Skala untuk dokumen cetak/PDF — transform (bukan zoom) agar kompatibel mobile. */
export function applyRaporPrintScale(root: HTMLElement, scale: number): void {
  const normalized = clampRaporContentScale(scale);
  const inner = measureRaporContentInner(root);
  const outer = root.querySelector<HTMLElement>(".rapor-content-scale-outer");

  root.style.setProperty("--rapor-content-scale", String(normalized));
  inner.style.setProperty("--rapor-content-scale", String(normalized));
  inner.style.zoom = "1";
  inner.style.transform =
    normalized === 1 ? "none" : `scale(${normalized})`;
  inner.style.transformOrigin = "top left";
  inner.style.width = "100%";
  inner.style.textAlign = "left";

  if (outer) {
    outer.style.display = "block";
    outer.style.width = "100%";
    outer.style.margin = "0";
    outer.style.padding = "0";
    outer.style.overflow = "visible";
    outer.style.textAlign = "left";
    outer.style.height =
      normalized === 1
        ? "auto"
        : `${Math.ceil(inner.scrollHeight * normalized)}px`;
  }
}

function measureRaporContentInner(root: HTMLElement): HTMLElement {
  if (root.classList.contains("rapor-print-unit")) {
    return (
      root.querySelector<HTMLElement>(".rapor-content-inner") ??
      root
    );
  }
  return (
    root.querySelector<HTMLElement>(".rapor-content-inner") ??
    root.querySelector<HTMLElement>(".rapor-km-body") ??
    root
  );
}

/** Skala otomatis per unit cetak (tiap lembar memadat di halamannya sendiri). */
export function fitAllRaporPrintUnits(root: HTMLElement, userScale = 1): void {
  const units = Array.from(root.querySelectorAll<HTMLElement>(".rapor-print-unit"));
  const targets =
    units.length > 0
      ? units
      : root.classList.contains("rapor-print-unit")
        ? [root]
        : [root];

  targets.forEach((unit) => {
    fitRaporContentToSingleA4Page(unit, userScale);
  });
}

/** Skala otomatis agar satu unit rapor muat satu halaman A4 portrait (cetak/PDF). */
export function fitRaporContentToSingleA4Page(
  root: HTMLElement,
  userScale = 1,
): number {
  const inner = measureRaporContentInner(root);
  const scaleTargets = [
    root,
    inner,
    ...Array.from(root.querySelectorAll<HTMLElement>(".rapor-content-scale-outer")),
  ].filter((el, i, arr) => arr.indexOf(el) === i);

  scaleTargets.forEach((el) => {
    el.style.setProperty("--rapor-content-scale", "1");
  });
  inner.style.zoom = "1";
  inner.style.transform = "none";

  const maxHeightPx = A4_PRINTABLE_HEIGHT_MM * MM_TO_PX;
  const maxWidthPx = A4_PRINTABLE_WIDTH_MM * MM_TO_PX;
  void inner.offsetHeight;
  const contentHeight = inner.scrollHeight;
  let contentWidth = Math.max(inner.scrollWidth, inner.offsetWidth);
  if (contentWidth < 100) {
    contentWidth = maxWidthPx;
  }

  let autoScale = 1;
  if (contentHeight > maxHeightPx) {
    autoScale = Math.min(autoScale, maxHeightPx / contentHeight);
  }
  if (contentWidth > maxWidthPx) {
    autoScale = Math.min(autoScale, maxWidthPx / contentWidth);
  }

  const finalScale = clampRaporContentScale(userScale * autoScale);
  applyRaporPrintScale(root, finalScale);

  return finalScale;
}
