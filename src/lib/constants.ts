/**
 * Display labels for database enums. Keys must match the Postgres enum values
 * in supabase/migrations/*_schema.sql.
 */

export const CATEGORIES = {
  laptops: "Laptops",
  accessories: "Accessories",
  networking: "Networking",
  power_ups: "Power / UPS",
  office_it: "Office IT",
} as const;
export type Category = keyof typeof CATEGORIES;

export const CONDITIONS = {
  new: "New",
  uk_used: "UK-used",
  refurbished: "Refurbished",
} as const;
export type Condition = keyof typeof CONDITIONS;

export const STOCK_STATUSES = {
  available: "Available",
  out_of_stock: "Out of stock",
} as const;
export type StockStatus = keyof typeof STOCK_STATUSES;

export const ORDER_STATUSES = {
  new: "New",
  vendor_confirmed: "Vendor confirmed",
  rider_assigned: "Rider assigned",
  picked_up: "Picked up",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  returned: "Returned",
} as const;
export type OrderStatus = keyof typeof ORDER_STATUSES;

export const PRODUCT_IMAGES_BUCKET = "product-images";
