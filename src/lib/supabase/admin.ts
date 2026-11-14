/**
 * Service-role Supabase client — BYPASSES Row Level Security.
 *
 * Server-only. Use it for: order creation, Paystack verification/webhook,
 * and all /admin reads & writes (after checking the user is the admin).
 * Never return raw rows from it to public pages without stripping private
 * fields (cost_price, vendor_id, vendor details).
 */
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import type { Database } from "@/types/database";

export function createAdminClient() {
  return createClient<Database>(publicEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
