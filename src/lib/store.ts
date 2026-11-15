/**
 * Storefront data access (server-side). Uses the cookie-less public client,
 * so only public data is reachable from here.
 *
 * React's cache() de-duplicates calls within one request — e.g. the layout
 * and a page can both call getSettings() and Supabase is queried once.
 */
import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { CATEGORIES, type Category } from "@/lib/constants";
import { PRODUCT_COLUMNS, toProduct, type Product } from "@/lib/products";

export type StoreSettings = {
  storeName: string;
  whatsappNumber: string; // 234…
  supportEmail: string | null;
  podMaxOrderValue: number; // kobo
};

export const getSettings = cache(async (): Promise<StoreSettings> => {
  const db = createPublicClient();
  const { data, error } = await db
    .from("settings")
    .select("store_name, whatsapp_number, support_email, pod_max_order_value")
    .single();
  if (error) throw error;
  return {
    storeName: data.store_name,
    whatsappNumber: data.whatsapp_number,
    supportEmail: data.support_email,
    podMaxOrderValue: data.pod_max_order_value,
  };
});

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const db = createPublicClient();
  const { data, error } = await db
    .from("public_products")
    .select(PRODUCT_COLUMNS)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map(toProduct);
}

export async function getNewestProducts(limit = 8): Promise<Product[]> {
  const db = createPublicClient();
  const { data, error } = await db
    .from("public_products")
    .select(PRODUCT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map(toProduct);
}

export type ProductSort = "newest" | "price_asc" | "price_desc";

export async function searchProducts({
  q,
  category,
  sort = "newest",
}: {
  q?: string;
  category?: string;
  sort?: ProductSort;
}): Promise<Product[]> {
  const db = createPublicClient();
  let query = db.from("public_products").select(PRODUCT_COLUMNS).limit(100);

  // Strip characters that have meaning in PostgREST filter syntax.
  const term = (q ?? "").replace(/[%_,().*:"\\]/g, " ").trim();
  if (term) query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  if (category && category in CATEGORIES) query = query.eq("category", category as Category);

  if (sort === "price_asc") query = query.order("selling_price", { ascending: true });
  else if (sort === "price_desc") query = query.order("selling_price", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data.map(toProduct);
}

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const db = createPublicClient();
  const { data, error } = await db
    .from("public_products")
    .select(PRODUCT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? toProduct(data) : null;
});

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const db = createPublicClient();
  const { data, error } = await db
    .from("public_products")
    .select(PRODUCT_COLUMNS)
    .eq("category", product.category)
    .neq("id", product.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map(toProduct);
}

/** For sitemap.xml */
export async function getAllProductSlugs(): Promise<{ slug: string; updated: string }[]> {
  const db = createPublicClient();
  const { data, error } = await db.from("public_products").select("slug, created_at");
  if (error) throw error;
  return data.map((r) => ({ slug: r.slug!, updated: r.created_at! }));
}
