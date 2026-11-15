"use server";
/**
 * "use server" at the top marks every export in this file as a Server Action:
 * a function the browser can call, which always runs on the server.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth";
import type { FormState } from "@/lib/forms";
import { rateLimit } from "@/lib/rate-limit";

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!email || !password) return { error: "Enter your email and password." };
  // Slow down password guessing: 10 attempts per 15 minutes per visitor.
  if (!(await rateLimit("admin-login", 10, 900))) return { error: "Too many login attempts. Wait 15 minutes and try again." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Invalid email or password." };

  if (!isAdminEmail(email)) {
    await supabase.auth.signOut();
    return { error: "This account doesn't have admin access." };
  }

  // Only allow redirects back into /admin (prevents open-redirect tricks).
  redirect(next.startsWith("/admin") && next !== "/admin/login" ? next : "/admin");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
