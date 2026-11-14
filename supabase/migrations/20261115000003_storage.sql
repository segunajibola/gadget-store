-- =============================================================================
-- 0003 — Storage bucket for product images
--
-- A *public* bucket means anyone can GET a file by its URL (needed for the
-- storefront). We add NO insert/update/delete policies on storage.objects,
-- so only the server (service-role key) can upload or remove images.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,                                            -- 5 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;
