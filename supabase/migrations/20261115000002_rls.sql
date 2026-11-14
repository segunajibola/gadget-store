-- =============================================================================
-- 0002 — Row Level Security + public view
--
-- Model:
--   * The browser (anon / authenticated roles) can read ONLY:
--       - public_products view (safe product columns + images)
--       - active zones, settings
--   * Everything else (orders, vendors, riders, cost prices, admin writes)
--     goes through server code using the service-role key, which bypasses RLS.
--   * We both enable RLS *and* revoke table privileges — two locks on the door.
-- =============================================================================

-- ---------- Enable RLS everywhere ------------------------------------------
alter table public.vendors              enable row level security;
alter table public.riders               enable row level security;
alter table public.zones                enable row level security;
alter table public.products             enable row level security;
alter table public.product_images       enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;
alter table public.settings             enable row level security;

-- ---------- Revoke direct access to sensitive tables -----------------------
-- Supabase grants anon/authenticated broad privileges on public tables by
-- default; RLS with no policies already blocks them, this is defence in depth.
revoke all on public.vendors, public.riders, public.products, public.product_images,
              public.orders, public.order_items, public.order_status_history,
              public.order_profit
  from anon, authenticated;
revoke all on sequence public.order_number_seq from anon, authenticated;

-- ---------- Zones & settings: public read-only ------------------------------
revoke insert, update, delete, truncate on public.zones, public.settings
  from anon, authenticated;
grant select on public.zones, public.settings to anon, authenticated;

create policy "Public can read active zones"
  on public.zones for select
  to anon, authenticated
  using (is_active);

create policy "Public can read settings"
  on public.settings for select
  to anon, authenticated
  using (true);

-- ---------- Public products view --------------------------------------------
-- This view deliberately runs with the view OWNER's rights (security_invoker
-- = false, the default), so it can read the locked-down products table. It
-- only exposes safe columns: NO cost_price, NO vendor_id.
-- Only active products are visible. Images are bundled as a JSON array.
create view public.public_products
with (security_invoker = false)
as
select
  p.id,
  p.name,
  p.slug,
  p.category,
  p.description,
  p.specs,
  p.condition,
  p.warranty,
  p.selling_price,
  p.stock_status,
  p.is_featured,
  p.created_at,
  coalesce(
    (select jsonb_agg(
              jsonb_build_object('path', pi.storage_path, 'alt', pi.alt)
              order by pi.sort_order, pi.created_at)
       from public.product_images pi
      where pi.product_id = p.id),
    '[]'::jsonb
  ) as images
from public.products p
where p.is_active;

revoke all on public.public_products from anon, authenticated;
grant select on public.public_products to anon, authenticated;

-- ---------- Functions -------------------------------------------------------
-- Trigger functions shouldn't be callable via the API.
revoke execute on function public.set_updated_at()   from public, anon, authenticated;
revoke execute on function public.log_order_status() from public, anon, authenticated;
