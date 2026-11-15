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
import { reviewPhotoUrl } from "@/lib/images";
import { PRODUCT_COLUMNS, toProduct, type Product } from "@/lib/products";

export type StoreSettings = {
  storeName: string;
  whatsappNumber: string; // 234…
  supportEmail: string | null;
  podMaxOrderValue: number; // kobo
  calendlyUrl: string | null; // free consultation booking link
  cacNumber: string | null;
  businessAddress: string | null;
  businessHours: string | null;
  instagramHandle: string | null; // without "@"
  whatsappChannelUrl: string | null;
};

export const getSettings = cache(async (): Promise<StoreSettings> => {
  const db = createPublicClient();
  const { data, error } = await db
    .from("settings")
    .select(
      "store_name, whatsapp_number, support_email, pod_max_order_value, calendly_url, cac_number, business_address, business_hours, instagram_handle, whatsapp_channel_url",
    )
    .single();
  if (error) throw error;
  return {
    storeName: data.store_name,
    whatsappNumber: data.whatsapp_number,
    supportEmail: data.support_email,
    podMaxOrderValue: data.pod_max_order_value,
    calendlyUrl: data.calendly_url,
    cacNumber: data.cac_number,
    businessAddress: data.business_address,
    businessHours: data.business_hours,
    instagramHandle: data.instagram_handle,
    whatsappChannelUrl: data.whatsapp_channel_url,
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
  minPrice,
  maxPrice,
  dealsOnly,
}: {
  q?: string;
  category?: string;
  sort?: ProductSort;
  minPrice?: number; // kobo, inclusive
  maxPrice?: number; // kobo, inclusive
  dealsOnly?: boolean;
}): Promise<Product[]> {
  const db = createPublicClient();
  let query = db.from("public_products").select(PRODUCT_COLUMNS).limit(100);

  // Strip characters that have meaning in PostgREST filter syntax.
  const term = (q ?? "").replace(/[%_,().*:"\\]/g, " ").trim();
  if (term) query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  if (category && category in CATEGORIES) query = query.eq("category", category as Category);
  if (minPrice) query = query.gte("selling_price", minPrice);
  if (maxPrice) query = query.lte("selling_price", maxPrice);
  if (dealsOnly) query = query.not("compare_at_price", "is", null);

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

/** Products with a "was" price, biggest discount first. */
export async function getDeals(limit = 8): Promise<Product[]> {
  const products = await searchProducts({ dealsOnly: true });
  return products
    .filter((p) => p.stockStatus === "available")
    .sort((a, b) => (b.compareAtPrice! - b.price) / b.compareAtPrice! - (a.compareAtPrice! - a.price) / a.compareAtPrice!)
    .slice(0, limit);
}

// ---------- Reviews ----------------------------------------------------------

export type Review = {
  id: string;
  createdAt: string;
  customerName: string;
  area: string | null;
  products: string | null;
  rating: number;
  comment: string;
  photoUrl: string | null;
  isSample: boolean;
};

export async function getApprovedReviews(limit = 6): Promise<{ reviews: Review[]; average: number; count: number }> {
  const db = createPublicClient();
  const [list, all] = await Promise.all([
    db
      .from("public_reviews")
      .select("id, created_at, customer_name, area, products, rating, comment, photo_path, is_sample")
      .order("created_at", { ascending: false })
      .limit(limit),
    db.from("public_reviews").select("rating"),
  ]);
  if (list.error) throw list.error;
  const ratings = (all.data ?? []).map((r) => r.rating ?? 0);
  return {
    reviews: list.data.map((r) => ({
      id: r.id!,
      createdAt: r.created_at!,
      customerName: r.customer_name!,
      area: r.area,
      products: r.products,
      rating: r.rating!,
      comment: r.comment!,
      photoUrl: r.photo_path ? reviewPhotoUrl(r.photo_path) : null,
      isSample: r.is_sample ?? false,
    })),
    average: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
    count: ratings.length,
  };
}

/** For sitemap.xml */
export async function getAllProductSlugs(): Promise<{ slug: string; updated: string }[]> {
  const db = createPublicClient();
  const { data, error } = await db.from("public_products").select("slug, created_at");
  if (error) throw error;
  return data.map((r) => ({ slug: r.slug!, updated: r.created_at! }));
}
