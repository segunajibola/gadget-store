"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminDb } from "@/lib/auth";
import { dbErrorMessage, firstError, formToObject, type FormState } from "@/lib/forms";

const leadSchema = z.object({
  id: z.uuid(),
  status: z.enum(["new", "contacted", "closed"]),
  admin_notes: z.string().trim().max(2000).transform((v) => v || null),
});

export async function saveLead(_prev: FormState, formData: FormData): Promise<FormState> {
  const db = await adminDb();
  const parsed = leadSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { id, ...values } = parsed.data;

  const { error } = await db.from("laptop_requests").update(values).eq("id", id);
  if (error) return { error: dbErrorMessage(error) };
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${id}`);
  return { message: "Saved." };
}
