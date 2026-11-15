-- =============================================================================
-- 0006 — Laptop finder leads + Calendly consultation link
-- =============================================================================

-- Booking link for the free consultation call (shown on the home page and
-- laptop finder). Public, like the rest of settings.
alter table public.settings add column calendly_url text;

-- A customer's laptop requirements + the AI suggestions we showed them.
-- PRIVATE (contact details): no public access, admin reads via service role.
create table public.laptop_requests (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- contact
  name             text not null,
  phone            text not null,               -- 234…
  email            text,

  -- requirements
  use_case         text not null,               -- programming | office | design | gaming | other
  condition_pref   text not null,               -- new | uk_used | refurbished | any
  brands           text[] not null default '{}',-- e.g. {dell,hp}; empty = any
  budget_max       bigint not null check (budget_max > 0),  -- kobo
  ram              text,                        -- e.g. "16GB"
  storage          text,                        -- e.g. "512GB SSD"
  screen           text,                        -- e.g. "14 inch"
  notes            text,

  -- AI result (what the customer saw)
  ai_summary       text,
  ai_suggestions   jsonb,                       -- { in_store: [...], other_options: [...], questions_for_call: [...] }

  -- follow-up
  status           text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  admin_notes      text
);
create index laptop_requests_created_idx on public.laptop_requests (created_at desc);
create index laptop_requests_phone_idx on public.laptop_requests (phone, created_at desc);
create trigger laptop_requests_updated_at before update on public.laptop_requests
  for each row execute function public.set_updated_at();

alter table public.laptop_requests enable row level security;
revoke all on public.laptop_requests from anon, authenticated;
