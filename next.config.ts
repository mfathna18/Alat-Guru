import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  typescript: {
    // Izinkan build production meski ada error TypeScript (mis. di Vercel).
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_MIDTRANS_CLIENT_KEY:
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
    NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION:
      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION ??
      process.env.MIDTRANS_IS_PRODUCTION ??
      "false",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withSerwist(nextConfig);
