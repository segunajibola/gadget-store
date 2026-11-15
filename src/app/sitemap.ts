import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/constants";
import { publicEnv } from "@/lib/env";
import { getAllProductSlugs } from "@/lib/store";

// Generates /sitemap.xml so Google can find every product. Rebuilt hourly.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.siteUrl;
  const products = await getAllProductSlugs();
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/products`, changeFrequency: "daily", priority: 0.8 },
    ...Object.keys(CATEGORIES).map((c) => ({
      url: `${base}/products?category=${c}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${base}/products/${p.slug}`,
      lastModified: p.updated,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
