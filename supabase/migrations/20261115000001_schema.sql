-- =============================================================================
-- 0001 — Core schema
-- Conventions:
--   * All money columns are BIGINT in KOBO (₦1 = 100 kobo). Never floats.
--   * Primary keys are UUIDs (gen_random_uuid() is built into Postgres 13+).
--   * created_at / updated_at on mutable tables; updated_at maintained by trigger.
-- =============================================================================

-- ---------- Enums ----------------------------------------------------------
create type product_category as enum (
  'laptops', 'accessories', 'networking', 'power_ups', 'office_it'
);

create type product_condition as enum ('new', 'uk_used', 'refurbished');

create type stock_status as enum ('available', 'out_of_stock');

create type order_status as enum (
  'new', 'vendor_confirmed', 'rider_assigned', 'picked_up',
  'delivered', 'completed', 'cancelled', 'returned'
);

create type payment_method as enum ('paystack', 'pay_on_delivery');

create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');

-- ---------- updated_at helper ----------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Vendors (internal only — never shown to customers) -------------
create table public.vendors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text,                 -- WhatsApp-capable number, e.g. 08012345678
  address     text,                 -- shop location, e.g. "Shop 12, Computer Village"
  notes       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger vendors_updated_at before update on public.vendors
  for each row execute function public.set_updated_at();

-- ---------- Riders ---------------------------------------------------------
create table public.riders (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text not null,
  notes       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger riders_updated_at before update on public.riders
  for each row execute function public.set_updated_at();

-- ---------- Delivery zones -------------------------------------------------
-- Areas of Lagos priced by distance from the pickup hub (Computer Village, Ikeja).
-- delivery_fee is what the customer pays; default_rider_cost is what we expect
-- to pay the rider. Both can be overridden per order in admin.
create table public.zones (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null unique,
  areas               text,                -- comma-separated areas covered, shown at checkout
  approx_distance_km  numeric(5,1),        -- from the hub; informational
  delivery_fee        bigint not null check (delivery_fee >= 0),
  default_rider_cost  bigint not null default 0 check (default_rider_cost >= 0),
  sort_order          int not null default 0,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger zones_updated_at before update on public.zones
  for each row execute function public.set_updated_at();

-- ---------- Products -------------------------------------------------------
create table public.products (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category       product_category not null,
  description    text,
  -- specs: ordered list of {"label": "RAM", "value": "16GB"}
  specs          jsonb not null default '[]'::jsonb check (jsonb_typeof(specs) = 'array'),
  condition      product_condition not null default 'new',
  warranty       text,                       -- e.g. "6 months vendor warranty"
  selling_price  bigint not null check (selling_price > 0),   -- kobo, public
  cost_price     bigint not null check (cost_price >= 0),     -- kobo, PRIVATE
  vendor_id      uuid references public.vendors (id) on delete set null,  -- PRIVATE
  stock_status   stock_status not null default 'available',
  is_featured    boolean not null default false,
  is_active      boolean not null default true,   -- false = hidden from the store
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index products_category_idx on public.products (category) where is_active;
create index products_featured_idx on public.products (is_featured) where is_active;
create index products_vendor_idx   on public.products (vendor_id);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ---------- Product images -------------------------------------------------
-- storage_path is the object path inside the "product-images" bucket,
-- e.g. "<product_id>/abc123.webp". Public URL is built in app code.
create table public.product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete cascade,
  storage_path  text not null,
  alt           text,
  sort_order    int not null default 0,     -- 0 = main image
  created_at    timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, sort_order);

-- ---------- Orders ---------------------------------------------------------
-- Human-friendly order number: ORD-10001, ORD-10002, ...
create sequence public.order_number_seq start 10001;

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text not null unique
                      default ('ORD-' || nextval('public.order_number_seq')),

  -- customer
  customer_name     text not null,
  customer_phone    text not null,
  customer_email    text,
  delivery_address  text not null,
  delivery_notes    text,

  -- delivery
  zone_id           uuid references public.zones (id) on delete set null,
  zone_name         text,                     -- snapshot, survives zone edits/deletes

  -- money (kobo). subtotal + delivery_fee = total the customer owes.
  subtotal          bigint not null check (subtotal >= 0),
  delivery_fee      bigint not null default 0 check (delivery_fee >= 0),
  total             bigint generated always as (subtotal + delivery_fee) stored,

  -- payment
  payment_method    payment_method not null,
  payment_status    payment_status not null default 'pending',
  paystack_reference text unique,
  amount_paid       bigint not null default 0 check (amount_paid >= 0),
  payment_fee       bigint not null default 0 check (payment_fee >= 0),  -- actual Paystack fee
  paid_at           timestamptz,

  -- fulfilment
  rider_id          uuid references public.riders (id) on delete set null,
  rider_cost        bigint not null default 0 check (rider_cost >= 0),
  status            order_status not null default 'new',
  admin_notes       text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index orders_status_idx   on public.orders (status);
create index orders_created_idx  on public.orders (created_at desc);
create index orders_phone_idx    on public.orders (customer_phone);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------- Order items ----------------------------------------------------
-- Name/price/cost are SNAPSHOTS at order time so later product edits don't
-- rewrite history. unit_cost and vendor_id are pre-filled from the product
-- and can be adjusted by admin after sourcing offline.
create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  product_id    uuid references public.products (id) on delete set null,
  product_name  text not null,
  product_slug  text,
  unit_price    bigint not null check (unit_price >= 0),
  unit_cost     bigint not null default 0 check (unit_cost >= 0),
  quantity      int not null check (quantity > 0),
  line_total    bigint generated always as (unit_price * quantity) stored,
  vendor_id     uuid references public.vendors (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index order_items_order_idx on public.order_items (order_id);

-- ---------- Order status history -------------------------------------------
create table public.order_status_history (
  id           bigint generated always as identity primary key,
  order_id     uuid not null references public.orders (id) on delete cascade,
  from_status  order_status,          -- null for the initial "new"
  to_status    order_status not null,
  note         text,
  created_at   timestamptz not null default now()
);
create index order_status_history_order_idx
  on public.order_status_history (order_id, created_at);

-- Log every status change automatically, whichever code path changes it.
create or replace function public.log_order_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history (order_id, from_status, to_status)
    values (new.id, null, new.status);
  elsif new.status is distinct from old.status then
    insert into public.order_status_history (order_id, from_status, to_status)
    values (new.id, old.status, new.status);
  end if;
  return new;
end;
$$;

create trigger orders_log_status
  after insert or update of status on public.orders
  for each row execute function public.log_order_status();

-- ---------- Settings (single row) ------------------------------------------
create table public.settings (
  id                   boolean primary key default true check (id),  -- forces one row
  store_name           text not null default 'Gadget Store',
  whatsapp_number      text not null,        -- international format, no "+": 234...
  support_email        text,
  hub_address          text not null default 'Computer Village, Ikeja, Lagos',
  pod_max_order_value  bigint not null default 30000000,  -- ₦300,000 in kobo
  updated_at           timestamptz not null default now()
);
create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------- Profit per order (admin only) -----------------------------------
-- profit = total − vendor cost of items − rider cost − payment fee
create view public.order_profit
with (security_invoker = true)   -- obeys the caller's RLS (anon/auth get nothing)
as
select
  o.id as order_id,
  o.order_number,
  o.created_at,
  o.status,
  o.total,
  coalesce(sum(i.unit_cost * i.quantity), 0)::bigint as vendor_cost,
  o.rider_cost,
  o.payment_fee,
  (o.total - coalesce(sum(i.unit_cost * i.quantity), 0)
           - o.rider_cost - o.payment_fee)::bigint as profit
from public.orders o
left join public.order_items i on i.order_id = o.id
group by o.id;
