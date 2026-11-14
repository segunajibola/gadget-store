/**
 * Supabase client for Server Components, Server Actions and Route Handlers
 * that acts AS THE LOGGED-IN USER (uses the anon key + auth cookies).
 *
 * Use it for: checking who is logged in (auth.getUser()) and public reads.
 * Do NOT use it for admin data — RLS blocks that. Use ./admin.ts instead,
 * after verifying the user is the admin.
 */
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export async function createClient() {
  // In Next 15+, cookies() is async.
  const cookieStore = await cookies();

  return createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components can't set cookies — that's fine, the proxy
          // (added in stage 2) refreshes the session cookie on each request.
        }
      },
    },
  });
}
