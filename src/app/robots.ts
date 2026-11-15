import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

// Generates /robots.txt
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/cart", "/checkout", "/order/", "/review/"] },
    sitemap: `${publicEnv.siteUrl}/sitemap.xml`,
  };
}
