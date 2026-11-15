"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminDb } from "@/lib/auth";
import {
  dbErrorMessage,
  firstError,
  formToObject,
  nairaAmount,
  optionalText,
  requiredText,
  type FormState,
} from "@/lib/forms";

const zoneSchema = z.object({
  id: z.string().optional(),
  name: requiredText("Name"),
  areas: optionalText,
  approx_distance_km: z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v?.trim()) return null;
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) {
        ctx.addIssue({ code: "custom", message: "Distance must be a positive number" });
        return z.NEVER;
      }
      return n;
    }),
  delivery_fee: nairaAmount("Delivery fee"),
  default_rider_cost: nairaAmount("Rider cost"),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean(),
});

export async function saveZone(_prev: FormState, formData: FormData): Promise<FormState> {
  const db = await adminDb();
  const parsed = zoneSchema.safeParse(formToObject(formData, ["is_active"]));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { id, ...values } = parsed.data;
  const { error } = id
    ? await db.from("zones").update(values).eq("id", id)
    : await db.from("zones").insert(values);
  if (error) return { error: dbErrorMessage(error) };

  revalidatePath("/", "layout"); // zones appear at checkout too
  redirect("/admin/zones");
}

export async function deleteZone(formData: FormData) {
  const db = await adminDb();
  const { error } = await db.from("zones").delete().eq("id", String(formData.get("id")));
  if (error) throw new Error(dbErrorMessage(error));
  revalidatePath("/", "layout");
  redirect("/admin/zones");
}
