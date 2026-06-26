import type { MetadataRoute } from "next";

import { siteIconUrl } from "@/lib/site/icons";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alat Guru",
    short_name: "Alat Guru",
    description:
      "Kelola kelas, nilai, absensi, dan rapor semester untuk guru Indonesia.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#171717",
    orientation: "portrait-primary",
    lang: "id",
    icons: [
      {
        src: siteIconUrl("/favicon.ico"),
        sizes: "48x48",
        type: "image/x-icon",
        purpose: "any",
      },
      {
        src: siteIconUrl("/icon.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: siteIconUrl("/icon.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
