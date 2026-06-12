import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {(phase: string) => import('next').NextConfig} */
const createNextConfig = (phase) => ({
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  webpack(config) {
    config.resolve.alias["@revenuecat/purchases-capacitor"] =
      path.resolve(__dirname, "lib/revenuecat-capacitor-stub.js");
    return config;
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" }
        ]
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Cache-Control", value: "public, max-age=3600" }
        ]
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bilder.ngdata.no"
      },
      {
        protocol: "https",
        hostname: "cdcimg.coop.no"
      },
      {
        protocol: "https",
        hostname: "bilder.kassal.app"
      },
      {
        protocol: "https",
        hostname: "images2.europris.no"
      },
      {
        protocol: "https",
        hostname: "spar.no"
      },
      {
        protocol: "https",
        hostname: "meny.no"
      }
    ]
  }
});

export default createNextConfig;
