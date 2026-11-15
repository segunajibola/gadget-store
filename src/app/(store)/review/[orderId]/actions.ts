"use server";
/**
 * Customer review submission. Public endpoints — the order UUID in the link
 * acts as the "ticket": only delivered/completed orders can be reviewed,
 * once each. Reviews start as "pending" until approved in admin.
 */
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { REVIEW_PHOTOS_BUCKET } from "@/lib/images";

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Loads an order if it can be reviewed now. */
async function reviewableOrder(orderId: string) {
  if (!z.uuid().safeParse(orderId).success) return { error: "Invalid review link." } as const;
  const db = createAdminClient();
  const [{ data: order }, { count }] = await Promise.all([
    db
      .from("orders")
      .select("id, status, customer_name, zone_name, order_items(product_name)")
      .eq("id", orderId)
      .maybeSingle(),
    db.from("reviews").select("id", { count: "exact", head: true }).eq("order_id", orderId),
  ]);
  if (!order) return { error: "Invalid review link." } as const;
  if (order.status !== "delivered" && order.status !== "completed") {
    return { error: "You can leave a review once your order has been delivered." } as const;
  }
  if ((count ?? 0) > 0) return { error: "Thanks — you've already reviewed this order." } as const;
  return { order } as const;
}

/** Step 1 (optional): signed URL so the browser uploads the photo directly to Storage. */
export async function createReviewPhotoUpload(
  orderId: string,
  contentType: string,
): Promise<{ path: string; token: string } | { error: string }> {
  const check = await reviewableOrder(orderId);
  if ("error" in check) return { error: check.error! };
  if (!PHOTO_TYPES.includes(contentType)) return { error: "Use a JPG, PNG or WebP photo." };

  const ext = contentType.split("/")[1].replace("jpeg", "jpg");
  const path = `${orderId}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await createAdminClient().storage.from(REVIEW_PHOTOS_BUCKET).createSignedUploadUrl(path);
  if (error) return { error: "Couldn't prepare the photo upload." };
  return { path: data.path, token: data.token };
}

const reviewSchema = z.object({
  rating: z.number().int().min(1, "Choose a star rating").max(5),
  comment: z.string().trim().min(3, "Tell us a little about your experience").max(1000),
  photoPath: z.string().nullable(),
});

/** Step 2: save the review (pending approval). */
export async function submitReview(
  orderId: string,
  input: z.input<typeof reviewSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const check = await reviewableOrder(orderId);
  if ("error" in check) return { ok: false, error: check.error! };
  const { order } = check;
  const d = parsed.data;

  if (d.photoPath && !d.photoPath.startsWith(`${orderId}/`)) return { ok: false, error: "Invalid photo." };

  // Public display name: first name + last initial ("Adaeze O.").
  const [first, ...rest] = order.customer_name.trim().split(/\s+/);
  const lastInitial = rest.length ? ` ${rest[rest.length - 1][0].toUpperCase()}.` : "";

  const { error } = await createAdminClient()
    .from("reviews")
    .insert({
      order_id: order.id,
      customer_name: `${first}${lastInitial}`,
      area: order.zone_name,
      products: order.order_items.map((i) => i.product_name).join(", ").slice(0, 300),
      rating: d.rating,
      comment: d.comment,
      photo_path: d.photoPath,
    });
  if (error) {
    // 23505 = unique violation → double submit
    if (error.code === "23505") return { ok: false, error: "Thanks — you've already reviewed this order." };
    console.error("[review]", error);
    return { ok: false, error: "We couldn't save your review. Please try again." };
  }
  return { ok: true };
}
