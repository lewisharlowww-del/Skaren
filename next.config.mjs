import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {(phase: string) => import('next').NextConfig} */
const createNextConfig = (phase) => ({
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  async redirects() {
    // The old animated splash + landing/front screen were removed.
    // Open the app directly on the real scanner with an instant HTTP redirect
    // (no meta-refresh flash).
    return [
      {
        source: "/",
        destination: "/scan",
        permanent: false
      }
    ];
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
