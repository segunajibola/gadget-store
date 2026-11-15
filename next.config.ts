import type { NextConfig } from "next";

// Allow next/image to load product photos from our Supabase Storage bucket.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

// Security headers on every response.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" }, // don't guess file types
  { key: "X-Frame-Options", value: "DENY" }, // the site can't be embedded in other sites (clickjacking)
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }, // HTTPS only (ignored on localhost)
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // don't advertise "X-Powered-By: Next.js"
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // cacheComponents is OFF on purpose: pages that read cookies/searchParams
  // simply render per request, which keeps the mental model simple.
  // We can add caching to storefront pages later if needed.
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
