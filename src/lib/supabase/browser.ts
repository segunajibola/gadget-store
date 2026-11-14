/**
 * Supabase client for Client Components ("use client"). Anon key only, so it
 * can read just what RLS allows: public_products, zones, settings — and the
 * admin login flow. Prefer fetching in Server Components where possible.
 */
import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
}
