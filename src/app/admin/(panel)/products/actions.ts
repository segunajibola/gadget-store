"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminDb } from "@/lib/auth";
import {
  CATEGORIES,
  CONDITIONS,
  PRODUCT_IMAGES_BUCKET,
  STOCK_STATUSES,
  type Category,
  type Condition,
  type StockStatus,
} from "@/lib/constants";
import {
  dbErrorMessage,
  firstError,
  formToObject,
  nairaAmount,
  optionalText,
  requiredText,
  slugify,
  type FormState,
} from "@/lib/forms";
import { ALLOWED_IMAGE_TYPES } from "@/lib/images";

// z.enum needs a non-empty tuple, hence the casts.
const categoryEnum = z.enum(Object.keys(CATEGORIES) as [Category, ...Category[]]);
const conditionEnum = z.enum(Object.keys(CONDITIONS) as [Condition, ...Condition[]]);
const stockEnum = z.enum(Object.keys(STOCK_STATUSES) as [StockStatus, ...StockStatus[]]);

const specsSchema = z.array(
  z.object({ label: z.string().trim().min(1), value: z.string().trim().min(1) }),
);

const productSchema = z
  .object({
    id: z.string().optional(),
    name: requiredText("Name"),
    slug: z.string().trim().optional(),
    category: categoryEnum,
    condition: conditionEnum,
    description: optionalText,
    specs: z.string().transform((v, ctx) => {
      try {
        return specsSchema.parse(JSON.parse(v || "[]"));
      } catch {
        ctx.addIssue({ code: "custom", message: "Specs are invalid" });
        return z.NEVER;
      }
    }),
    warranty: optionalText,
    selling_price: nairaAmount("Selling price").refine((k) => k > 0, "Selling price must be above ₦0"),
    cost_price: nairaAmount("Vendor cost price"),
    vendor_id: optionalText,
    stock_status: stockEnum,
    is_featured: z.boolean(),
    is_active: z.boolean(),
  })
  // Never sell at a loss by mistake.
  .refine((p) => p.cost_price <= p.selling_price, {
    message: "Vendor cost can't be higher than the selling price.",
    path: ["cost_price"],
  })
  // Blank slug → generate from name.
  .transform((p) => ({ ...p, slug: slugify(p.slug || p.name) }))
  .refine((p) => p.slug.length > 0, { message: "Slug can't be empty" });

/** Storefront pages show products, so clear the whole cache after changes. */
function revalidateStore() {
  revalidatePath("/", "layout");
}

export async function saveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const db = await adminDb();
  const parsed = productSchema.safeParse(
    formToObject(formData, ["is_featured", "is_active"]),
  );
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { id, ...values } = parsed.data;

  if (id) {
    const { error } = await db.from("products").update(values).eq("id", id);
    if (error) return { error: dbErrorMessage(error) };
    revalidateStore();
    return { message: "Product saved." };
  }

  const { data, error } = await db.from("products").insert(values).select("id").single();
  if (error) return { error: dbErrorMessage(error) };
  revalidateStore();
  // Images need a product id, so go to the edit page to add them.
  redirect(`/admin/products/${data.id}?created=1`);
}

export async function deleteProduct(formData: FormData) {
  const db = await adminDb();
  const id = String(formData.get("id"));

  // Remove image files from Storage first (DB rows cascade-delete).
  const { data: images } = await db.from("product_images").select("storage_path").eq("product_id", id);
  if (images?.length) {
    await db.storage.from(PRODUCT_IMAGES_BUCKET).remove(images.map((i) => i.storage_path));
  }

  const { error } = await db.from("products").delete().eq("id", id);
  if (error) throw new Error(dbErrorMessage(error));
  revalidateStore();
  redirect("/admin/products");
}

// ---------- Images ----------------------------------------------------------
// Upload flow (keeps big files off our server):
//   1. createImageUploadUrl → server creates a one-time signed upload URL
//   2. browser uploads the file straight to Supabase Storage with it
//   3. addProductImage → server records the file in product_images

type UploadTicket = { path: string; token: string } | { error: string };

export async function createImageUploadUrl(
  productId: string,
  contentType: string,
): Promise<UploadTicket> {
  const db = await adminDb();
  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) return { error: "Use JPG, PNG, WebP or AVIF." };

  const ext = contentType.split("/")[1].replace("jpeg", "jpg");
  const path = `${productId}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await db.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .createSignedUploadUrl(path);
  if (error) return { error: error.message };
  return { path: data.path, token: data.token };
}

export async function addProductImage(productId: string, path: string): Promise<FormState> {
  const db = await adminDb();
  if (!path.startsWith(`${productId}/`)) return { error: "Invalid image path." };

  // Put new images at the end.
  const { data: last } = await db
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await db.from("product_images").insert({
    product_id: productId,
    storage_path: path,
    sort_order: (last?.sort_order ?? -1) + 1,
  });
  if (error) return { error: dbErrorMessage(error) };
  revalidateStore();
}

export async function deleteProductImage(imageId: string) {
  const db = await adminDb();
  const { data: image } = await db
    .from("product_images")
    .select("storage_path")
    .eq("id", imageId)
    .single();
  if (!image) return;
  await db.storage.from(PRODUCT_IMAGES_BUCKET).remove([image.storage_path]);
  await db.from("product_images").delete().eq("id", imageId);
  revalidateStore();
}

/** Move an image to position 0 (the main image) and renumber the rest. */
export async function setMainImage(imageId: string) {
  const db = await adminDb();
  const { data: image } = await db
    .from("product_images")
    .select("product_id")
    .eq("id", imageId)
    .single();
  if (!image) return;

  const { data: all } = await db
    .from("product_images")
    .select("id")
    .eq("product_id", image.product_id)
    .order("sort_order");
  const ordered = [imageId, ...(all ?? []).map((i) => i.id).filter((id) => id !== imageId)];

  await Promise.all(
    ordered.map((id, index) => db.from("product_images").update({ sort_order: index }).eq("id", id)),
  );
  revalidateStore();
}
