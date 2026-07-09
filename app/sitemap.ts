import type { MetadataRoute } from "next";
import { getAllAdditives } from "@/lib/additivesSeo";

const SITE = "https://skaren.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const additives = getAllAdditives();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/additives`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/tilsetningsstoffer`, changeFrequency: "weekly", priority: 0.9 },
  ];

  // One entry per additive, per language, with hreflang alternates so Google
  // serves the right language version in each market.
  const additivePages: MetadataRoute.Sitemap = additives.flatMap((e) => {
    const enUrl = `${SITE}/additives/${e.slug}`;
    const noUrl = `${SITE}/tilsetningsstoffer/${e.slug}`;
    const languages = { en: enUrl, no: noUrl };
    return [
      { url: enUrl, changeFrequency: "monthly" as const, priority: 0.7, alternates: { languages } },
      { url: noUrl, changeFrequency: "monthly" as const, priority: 0.7, alternates: { languages } },
    ];
  });

  return [...staticPages, ...additivePages];
}
