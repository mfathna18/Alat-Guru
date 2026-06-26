import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { PRODUCTION_SITE_ORIGIN } from "@/lib/auth/site-url";
import { siteIconUrl } from "@/lib/site/icons";
import { QueryProvider } from "@/providers/query-provider";

import "./globals.css";

const faviconUrl = siteIconUrl("/favicon.ico");
const iconPngUrl = siteIconUrl("/icon.png");
const appleIconUrl = siteIconUrl("/apple-icon.png");

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(PRODUCTION_SITE_ORIGIN),
  title: {
    default: "Alat Guru",
    template: "%s | Alat Guru",
  },
  description:
    "Kelola kelas, nilai, absensi, dan rapor semester — praktis untuk guru Indonesia.",
  applicationName: "Alat Guru",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: iconPngUrl, type: "image/png", sizes: "512x512" },
      { url: faviconUrl, sizes: "any" },
    ],
    shortcut: faviconUrl,
    apple: [{ url: appleIconUrl, type: "image/png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Alat Guru",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href={iconPngUrl} type="image/png" sizes="512x512" />
        <link rel="icon" href={faviconUrl} sizes="any" />
        <link rel="shortcut icon" href={faviconUrl} />
        <link rel="apple-touch-icon" href={appleIconUrl} />
      </head>
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster richColors closeButton position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
