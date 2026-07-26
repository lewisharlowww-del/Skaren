import type { MetadataRoute } from "next";

const SITE = "https://skaren.app";

// Note: the E-number / additive SEO pages now live on the marketing site
// (www.skaren.app) and the old apex URLs 301-redirect there. They are
// intentionally omitted here so Google consolidates ranking on www.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE}/about`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
