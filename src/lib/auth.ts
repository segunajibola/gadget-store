/**
 * Admin auth — the "Data Access Layer" for admin data.
 *
 * Rule: admin pages and Server Actions get their database client ONLY via
 * adminDb(), which checks the logged-in user first. Server Actions are
 * public HTTP endpoints under the hood, so each one must check auth itself;
 * the layout/proxy checks are not enough on their own.
 */
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env.server";

export type AdminUser = { id: string; email: string };

export function isAdminEmail(email: string | undefined | null): boolean {
  return !!email && serverEnv.adminEmails.includes(email.toLowerCase());
}

/**
 * Returns the admin user, or null. Wrapped in React's cache() so multiple
 * calls during one request only hit Supabase once.
 */
export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser(); // verified with Supabase, not just read from the cookie
  if (!user || !isAdminEmail(user.email)) return null;
  return { id: user.id, email: user.email! };
});

/** Use at the top of admin pages/actions. Redirects to login if not admin. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** Auth check + service-role client in one call. */
export async function adminDb() {
  await requireAdmin();
  return createAdminClient();
}
