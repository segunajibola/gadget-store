/**
 * Public environment variables — safe for the browser.
 *
 * Next.js inlines `process.env.NEXT_PUBLIC_*` into client bundles at build
 * time. It must be written out literally (process.env.NEXT_PUBLIC_X), not
 * accessed dynamically, or Next can't inline it.
 */
function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const publicEnv = {
  supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};
