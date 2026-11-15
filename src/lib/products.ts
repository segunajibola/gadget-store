/**
 * Public product type + mapping. Safe for the browser: built only from the
 * public_products view (no cost price, no vendor).
 */
import type { Database } from "@/types/database";
import type { Category, Condition, StockStatus } from "@/lib/constants";
import { productImageUrl } from "@/lib/images";

// The columns we select (PRODUCT_COLUMNS) — everything except created_at.
type ViewRow = Omit<Database["public"]["Views"]["public_products"]["Row"], "created_at">;

export type Product = {
  id: string;
  name: string;
  slug: string;
  category: Category;
  condition: Condition;
  description: string | null;
  specs: { label: string; value: string }[];
  warranty: string | null;
  price: number; // kobo
  stockStatus: StockStatus;
  isFeatured: boolean;
  images: { url: string; alt: string | null }[];
};

/** Columns to select from public_products (keep in sync with Product). */
export const PRODUCT_COLUMNS =
  "id, name, slug, category, condition, description, specs, warranty, selling_price, stock_status, is_featured, images";

/**
 * Views make every column nullable in the generated types, even though the
 * underlying table columns are NOT NULL. This converts a row to a clean type.
 */
export function toProduct(row: ViewRow): Product {
  const images = (row.images as { path: string; alt: string | null }[] | null) ?? [];
  return {
    id: row.id!,
    name: row.name!,
    slug: row.slug!,
    category: row.category!,
    condition: row.condition!,
    description: row.description,
    specs: (row.specs as Product["specs"] | null) ?? [],
    warranty: row.warranty,
    price: row.selling_price!,
    stockStatus: row.stock_status!,
    isFeatured: row.is_featured ?? false,
    images: images.map((i) => ({ url: productImageUrl(i.path), alt: i.alt })),
  };
}
