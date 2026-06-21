"use client";

import { createRoot, type Root } from "react-dom/client";

import { SemesterGanjilManTemplate } from "@/components/rapor/templates/semester-ganjil-man/semester-ganjil-man-template";
import type { ERaporExportOptions } from "@/lib/export/e-rapor-pdf";
import { A4_WIDTH_PX, waitForImages } from "@/lib/export/rapor/html-capture-pdf";
import { finalizeRaporTables } from "@/lib/export/rapor/rapor-print-document";
import type { ERaporPreviewData } from "@/lib/services/e-rapor";

export interface RenderedManRapor {
  root: HTMLElement;
  cleanup: () => void;
}

/** Render template MAN ke DOM tersembunyi — dipakai PDF & Word export. */
export async function renderManRaporToDom(
  data: ERaporPreviewData,
  options: ERaporExportOptions = {},
): Promise<RenderedManRapor> {
  const container = document.createElement("div");
  container.setAttribute("data-rapor-render", "true");
  Object.assign(container.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: `${A4_WIDTH_PX}px`,
    opacity: "0.01",
    pointerEvents: "none",
    zIndex: "2147483645",
    background: "#ffffff",
  });
  document.body.appendChild(container);

  let reactRoot: Root | null = createRoot(container);

  reactRoot.render(
    <SemesterGanjilManTemplate
      data={data}
      options={{
        watermarkLogo: options.watermarkLogo ?? false,
        printMode: true,
        printRoot: true,
        pageNumber: 2,
        totalPages: 2,
      }}
    />,
  );

  await waitForImages(container);
  await new Promise((r) => setTimeout(r, 150));

  const root = container.querySelector("#rapor-print-root");
  if (!(root instanceof HTMLElement)) {
    reactRoot.unmount();
    container.remove();
    throw new Error("Gagal merender rapor.");
  }

  finalizeRaporTables(root);

  return {
    root,
    cleanup: () => {
      reactRoot?.unmount();
      reactRoot = null;
      container.remove();
    },
  };
}
