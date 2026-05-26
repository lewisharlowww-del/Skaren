import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {(phase: string) => import('next').NextConfig} */
const createNextConfig = (phase) => ({
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
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
