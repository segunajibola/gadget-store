/**
 * Anon Supabase client WITHOUT cookies — for public storefront reads on the
 * server. Because it doesn't touch cookies, pages using it can be cached
 * (static / ISR), which makes the store fast. RLS limits it to
 * public_products, active zones and settings.
 */
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export function createPublicClient() {
  return createClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
