import { publicEnv } from "@/lib/env";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/constants";

/** Storage path → public URL (bucket is public-read). */
export function productImageUrl(path: string): string {
  return `${publicEnv.supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${path}`;
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // must match bucket limit (migration 0003)
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export const REVIEW_PHOTOS_BUCKET = "review-photos";

/** Review photo path → public URL. */
export function reviewPhotoUrl(path: string): string {
  return `${publicEnv.supabaseUrl}/storage/v1/object/public/${REVIEW_PHOTOS_BUCKET}/${path}`;
}
