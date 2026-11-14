/**
 * SERVER-ONLY secrets. The `server-only` import makes the build fail if any
 * Client Component (or anything it imports) tries to import this file, so
 * these keys can never end up in the browser bundle.
 */
import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const serverEnv = {
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get paystackSecretKey() {
    return required("PAYSTACK_SECRET_KEY");
  },
  /** Comma-separated list; only these emails can use /admin. */
  get adminEmails(): string[] {
    return required("ADMIN_EMAILS")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  },
};
