import type { MetadataRoute } from "next";
import { cities } from "@/data/cities";
import { citySlug, hubPairs, pairSlug } from "@/lib/slugs";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/time`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    ...cities.map((city) => ({
      url: `${SITE_URL}/time/${citySlug(city)}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...hubPairs().map(({ from, to }) => ({
      url: `${SITE_URL}/time/${pairSlug(from, to)}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
