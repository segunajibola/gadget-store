"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminDb } from "@/lib/auth";
import {
  dbErrorMessage,
  firstError,
  formToObject,
  nairaAmount,
  ngPhone,
  optionalText,
  requiredText,
  type FormState,
} from "@/lib/forms";

const settingsSchema = z.object({
  store_name: requiredText("Store name"),
  whatsapp_number: ngPhone("WhatsApp number"),
  support_email: optionalText.pipe(z.email("Support email is invalid").nullable()),
  hub_address: requiredText("Hub address"),
  pod_max_order_value: nairaAmount("Pay-on-delivery limit"),
  calendly_url: optionalText.pipe(
    z.url({ protocol: /^https$/, error: "Booking link must be a full https:// link" }).nullable(),
  ),
});

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const db = await adminDb();
  const parsed = settingsSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  // Single-row table: the row's id is always `true`.
  const { error } = await db.from("settings").update(parsed.data).eq("id", true);
  if (error) return { error: dbErrorMessage(error) };

  revalidatePath("/", "layout"); // WhatsApp button etc. appear on every page
  return { message: "Settings saved." };
}
