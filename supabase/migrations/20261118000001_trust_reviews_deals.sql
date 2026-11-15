-- =============================================================================
-- 0007 — Trust & marketing: business details, deals, customer reviews
-- =============================================================================

-- ---------- Business details (shown in the trust strip / footer) ----------
alter table public.settings
  add column cac_number           text,   -- e.g. "RC 1234567"
  add column business_address     text,
  add column business_hours       text,
  add column instagram_handle     text,   -- without "@"
  add column whatsapp_channel_url text;   -- optional WhatsApp Channel link for deals

-- PLACEHOLDERS — replace in Admin → Settings before launch.
update public.settings set
  cac_number       = 'RC 0000000',
  business_address = 'Shop 00, Example Plaza, Computer Village, Ikeja, Lagos',
  business_hours   = 'Mon–Sat, 9am–6pm',
  instagram_handle = 'yourstore.placeholder'
where id;

-- ---------- Hot deals: "was" price ----------------------------------------
alter table public.products
  add column compare_at_price bigint
    check (compare_at_price is null or compare_at_price > selling_price);  -- kobo

-- Re-create the public view with the new column appended at the end
-- (Postgres only allows adding columns at the end with CREATE OR REPLACE).
create or replace view public.public_products
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
  ) as images,
  p.compare_at_price
from public.products p
where p.is_active;

-- ---------- Customer reviews ----------------------------------------------
-- Collected via a link sent after delivery (/review/<order id>), shown on the
-- site only after admin approval.
create table public.reviews (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  order_id       uuid references public.orders (id) on delete set null,
  customer_name  text not null,          -- display name, e.g. "Adaeze O."
  area           text,                   -- e.g. "Lekki"
  products       text,                   -- e.g. "HP EliteBook 840 G5"
  rating         int  not null check (rating between 1 and 5),
  comment        text not null check (char_length(comment) between 3 and 1000),
  photo_path     text,                   -- in the review-photos bucket
  status         text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  is_sample      boolean not null default false  -- demo content: labelled "Sample" on the site
);
-- One review per order.
create unique index reviews_order_unique on public.reviews (order_id) where order_id is not null;
create index reviews_status_idx on public.reviews (status, created_at desc);

alter table public.reviews enable row level security;
revoke all on public.reviews from anon, authenticated;

-- Public read of APPROVED reviews only, without the order link.
create view public.public_reviews
with (security_invoker = false)
as
select id, created_at, customer_name, area, products, rating, comment, photo_path, is_sample
from public.reviews
where status = 'approved';

revoke all on public.public_reviews from anon, authenticated;
grant select on public.public_reviews to anon, authenticated;

-- Review photo bucket: public read, uploads only via server-issued signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-photos', 'review-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- One SAMPLE review so the section can be previewed. Delete it in Admin → Reviews.
insert into public.reviews (customer_name, area, products, rating, comment, status, is_sample)
values (
  'Tunde A.', 'Yaba', 'HP EliteBook 840 G5', 5,
  'Ordered in the morning and the rider brought it the same afternoon. The laptop was exactly as described — clean UK-used, battery holds well. They even called to confirm before sending. Will buy again.',
  'approved', true
);
