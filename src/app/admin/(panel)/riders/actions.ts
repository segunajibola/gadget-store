"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminDb } from "@/lib/auth";
import {
  dbErrorMessage,
  firstError,
  formToObject,
  ngPhone,
  optionalText,
  requiredText,
  type FormState,
} from "@/lib/forms";

const riderSchema = z.object({
  id: z.string().optional(),
  name: requiredText("Name"),
  phone: ngPhone("Phone"),
  notes: optionalText,
  is_active: z.boolean(),
});

export async function saveRider(_prev: FormState, formData: FormData): Promise<FormState> {
  const db = await adminDb();
  const parsed = riderSchema.safeParse(formToObject(formData, ["is_active"]));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { id, ...values } = parsed.data;
  const { error } = id
    ? await db.from("riders").update(values).eq("id", id)
    : await db.from("riders").insert(values);
  if (error) return { error: dbErrorMessage(error) };

  revalidatePath("/admin/riders");
  redirect("/admin/riders");
}

export async function deleteRider(formData: FormData) {
  const db = await adminDb();
  const { error } = await db.from("riders").delete().eq("id", String(formData.get("id")));
  if (error) throw new Error(dbErrorMessage(error));
  revalidatePath("/admin/riders");
  redirect("/admin/riders");
}
