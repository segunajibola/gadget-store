/**
 * Shared helpers for Server Action forms.
 *
 * Pattern: a form calls a Server Action shaped like
 *   (prevState: FormState, formData: FormData) => Promise<FormState>
 * which validates input with zod, writes to the DB, and either returns
 * { error } (shown under the form) or redirects on success.
 */
import { z } from "zod";
import { nairaToKobo } from "@/lib/money";
import { normalizeNgPhone } from "@/lib/phone";

export type FormState = { error?: string; message?: string } | undefined;
export type FormAction = (prev: FormState, formData: FormData) => Promise<FormState>;

/** FormData → plain object. Checkboxes become true/false. */
export function formToObject(formData: FormData, checkboxes: string[] = []) {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") obj[key] = value;
  }
  for (const key of checkboxes) obj[key] = formData.get(key) === "on";
  return obj;
}

/** First validation message, for showing to the user. */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

// ---------- Reusable zod fields ----------

export const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} is required`);

/** Empty string → null, so optional DB columns get NULL not "". */
export const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));

/** Naira input ("1,250,000") → kobo integer. */
export const nairaAmount = (label: string) =>
  z.string().transform((v, ctx) => {
    const kobo = nairaToKobo(v);
    if (kobo === null || v.trim() === "") {
      ctx.addIssue({ code: "custom", message: `${label} must be a valid amount` });
      return z.NEVER;
    }
    return kobo;
  });

/** Nigerian phone → 234XXXXXXXXXX. */
export const ngPhone = (label: string) =>
  z.string().transform((v, ctx) => {
    const phone = normalizeNgPhone(v);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: `${label} must be a valid Nigerian number` });
      return z.NEVER;
    }
    return phone;
  });

export const optionalNgPhone = (label: string) =>
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v?.trim()) return null;
      const phone = normalizeNgPhone(v);
      if (!phone) {
        ctx.addIssue({ code: "custom", message: `${label} must be a valid Nigerian number` });
        return z.NEVER;
      }
      return phone;
    });

/** Friendly message for common Postgres errors. */
export function dbErrorMessage(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "That value is already in use (must be unique).";
  if (error.code === "23503") return "This record is linked to other data and can't be changed that way.";
  if (error.code === "23514") return "A value failed a database check — please review the form.";
  console.error("[db]", error);
  return "Something went wrong saving to the database.";
}

/** "HP EliteBook 840 G5!" → "hp-elitebook-840-g5" */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
