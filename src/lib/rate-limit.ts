/**
 * Rate limiting for public Server Actions — SERVER ONLY.
 *
 *   if (!(await rateLimit("checkout", 8, 3600))) return { error: "Too many attempts…" };
 *
 * Counts hits per visitor (hashed IP address) in Postgres via the
 * hit_rate_limit() function (migration 0008). Fails OPEN: if the check
 * itself errors, the request is allowed, so customers are never blocked by
 * our own outage.
 */
import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/** Visitor IP from the proxy headers Vercel sets. */
async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** We never store raw IP addresses — only a short one-way hash. */
function hashId(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

/**
 * Records a hit for this visitor under `name` and returns true if they're
 * within `limit` hits per `windowSeconds`. Pass `id` to limit by something
 * other than IP (e.g. a phone number).
 */
export async function rateLimit(name: string, limit: number, windowSeconds: number, id?: string): Promise<boolean> {
  try {
    const key = `${name}:${hashId(id ?? (await clientIp()))}`;
    const { data, error } = await createAdminClient().rpc("hit_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    return data !== false;
  } catch (e) {
    console.error("[rate-limit]", e);
    return true;
  }
}

export const TOO_MANY = "Too many attempts. Please wait a few minutes and try again, or chat with us on WhatsApp.";
