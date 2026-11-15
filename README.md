# Gadget Store

Online IT gadget store for Lagos, Nigeria. No-stock model: products are listed
at our price, the customer orders, we source from a vendor offline, and a rider
picks up from Computer Village (Ikeja) and delivers.

**Stack:** Next.js (App Router, TypeScript) · Tailwind CSS · Supabase (Postgres,
Auth, Storage) · Paystack · Vercel

---

## Setup

### 1. Install
```bash
npm install
```

### 2. Environment variables
```bash
cp .env.example .env.local
```
Fill in `.env.local`:

| Variable | Where to find it | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | no |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page (anon / publishable key) | no |
| `SUPABASE_SERVICE_ROLE_KEY` | same page (service_role / secret key) | **yes** |
| `PAYSTACK_SECRET_KEY` | Paystack → Settings → API Keys (test key) | **yes** |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | same page | no |
| `ADMIN_EMAILS` | your admin login email(s), comma-separated | no |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally | no |

### 3. Database (Supabase CLI)
The CLI is installed as a dev dependency, so use `npx supabase ...`.

```bash
npx supabase login                       # opens browser, one-time
npx supabase link --project-ref <ref>    # <ref> = the id in your project URL; asks for DB password
npm run db:push                          # = supabase db push --remote (CLI v3 targets local unless --remote)
npm run db:types                         # generates src/types/database.ts from your schema
```

Migrations (run in order):
| File | What it does |
|---|---|
| `…01_schema.sql` | enums, tables, foreign keys, triggers, `order_profit` view |
| `…02_rls.sql` | Row Level Security, revokes, `public_products` view |
| `…03_storage.sql` | public `product-images` bucket (server-only uploads) |
| `…04_initial_data.sql` | settings row + starter Lagos delivery zones (placeholder fees) |

To change the schema later: `npx supabase migration new <name>`, write SQL,
then `npm run db:push`. Never edit a migration that has already been pushed.

### 4. Create your admin user
Supabase → Authentication → Users → **Add user** → enter email + password
(tick "Auto confirm"). Use the same email you put in `ADMIN_EMAILS`.
Also: Authentication → Sign In / Providers → turn **off** "Allow new users to
sign up", so nobody else can create an account.

### 5. Run
```bash
npm run dev
```
Open http://localhost:3000.

---

## Security model (short version)

- The browser only ever sees the **anon key**, which can read just
  `public_products` (no cost price, no vendor), active `zones` and `settings`.
- Orders, vendors, riders, cost prices and every admin action go through
  **server code** using the service-role key (`src/lib/supabase/admin.ts`).
- Files holding secrets import `server-only`, so the build fails if client
  code ever imports them.
- Paystack payments are initialised and **verified on the server** (route
  handler + signed webhook) — the browser is never trusted to say "paid".

## Money
All amounts are stored as **integer kobo** (₦1 = 100 kobo). Use
`formatNaira()` / `nairaToKobo()` from `src/lib/money.ts` at the edges.

## Build stages
1. ✅ Setup, schema, migrations, RLS
2. ✅ Admin auth + CRUD (products with images, vendors, riders, zones, settings)
3. ✅ Storefront: home, listing, product page, cart
4. Checkout, orders, Paystack (test) + webhook, pay on delivery
5. Admin orders: status flow, assignment, WhatsApp, profit, dashboard
6. Order tracking, polish, deploy to Vercel
