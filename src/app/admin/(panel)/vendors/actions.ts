"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminDb } from "@/lib/auth";
import {
  dbErrorMessage,
  firstError,
  formToObject,
  optionalNgPhone,
  optionalText,
  requiredText,
  type FormState,
} from "@/lib/forms";

const vendorSchema = z.object({
  id: z.string().optional(),
  name: requiredText("Name"),
  phone: optionalNgPhone("Phone"),
  address: optionalText,
  notes: optionalText,
  is_active: z.boolean(),
});

/** Create (no id) or update (with id). */
export async function saveVendor(_prev: FormState, formData: FormData): Promise<FormState> {
  const db = await adminDb(); // auth check — every action must do this
  const parsed = vendorSchema.safeParse(formToObject(formData, ["is_active"]));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { id, ...values } = parsed.data;
  const { error } = id
    ? await db.from("vendors").update(values).eq("id", id)
    : await db.from("vendors").insert(values);
  if (error) return { error: dbErrorMessage(error) };

  revalidatePath("/admin/vendors");
  redirect("/admin/vendors");
}

export async function deleteVendor(formData: FormData) {
  const db = await adminDb();
  const id = String(formData.get("id"));
  // products.vendor_id / order_items.vendor_id are ON DELETE SET NULL,
  // so deleting is safe, but you'll lose the link. Prefer "inactive".
  const { error } = await db.from("vendors").delete().eq("id", id);
  if (error) throw new Error(dbErrorMessage(error));
  revalidatePath("/admin/vendors");
  redirect("/admin/vendors");
}
