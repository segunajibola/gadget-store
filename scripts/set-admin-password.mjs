/**
 * Set (reset) the admin user's password without email.
 *
 * Usage (from the project folder):
 *   node --env-file=.env.local scripts/set-admin-password.mjs
 *
 * Uses the service-role key from .env.local, so run it only on your own machine.
 */
import { createClient } from "@supabase/supabase-js";
import readline from "node:readline/promises";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const defaultEmail = (process.env.ADMIN_EMAILS ?? "").split(",")[0].trim();
if (!url || !key) throw new Error("Missing Supabase env vars — did you pass --env-file=.env.local?");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const email = (await rl.question(`Admin email [${defaultEmail}]: `)).trim() || defaultEmail;
const password = await rl.question("New password (min 8 chars): ");
rl.close();

if (password.length < 8) throw new Error("Password must be at least 8 characters.");

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await supabase.auth.admin.listUsers();
if (error) throw error;

const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) throw new Error(`No Supabase Auth user with email ${email}`);

const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password });
if (updateError) throw updateError;

console.log(`✅ Password updated for ${email}. You can log in at /admin/login now.`);
