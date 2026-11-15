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

| Variable                          | Where to find it                           | Secret? |
| --------------------------------- | ------------------------------------------ | ------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | Supabase → Project Settings → API          | no      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | same page (anon / publishable key)         | no      |
| `SUPABASE_SERVICE_ROLE_KEY`       | same page (service_role / secret key)      | **yes** |
| `PAYSTACK_SECRET_KEY`             | Paystack → Settings → API Keys (test key)  | **yes** |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | same page                                  | no      |
| `ADMIN_EMAILS`                    | your admin login email(s), comma-separated | no      |
| `NEXT_PUBLIC_SITE_URL`            | `http://localhost:3000` locally            | no      |

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

## Payments (Paystack)

Flow: checkout → `placeOrder` Server Action creates the order (prices from the
DB, `create_order` SQL function) → Paystack payment page → Paystack redirects to
`/api/paystack/callback` → server **verifies** with Paystack → `/order/<id>`.
`/api/paystack/webhook` does the same verification server-to-server, so payments
are recorded even if the customer closes the tab.

**Test payment** (with `sk_test_…` keys) — on Paystack's page use:
card `4084 0840 8408 4081`, any future expiry, CVV `408`, PIN `0000`, OTP `123456`.

**Webhook URL** — Paystack can't reach `localhost`, so locally the callback alone
confirms payments. After deploying, set in Paystack → Settings → API Keys & Webhooks
→ *Test Webhook URL*: `https://<your-domain>/api/paystack/webhook`.

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

## Deploying to Vercel

### 1. Create the project
1. (Recommended) make the GitHub repo **private**.
2. vercel.com → sign in with GitHub → **Add New… → Project** → import `gadget-store`.
   Framework is detected as Next.js; leave build settings as they are.
3. Before clicking Deploy, open **Environment Variables** and add every variable
   from `.env.local` (all environments):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | same as `.env.local` |
| `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | **test** keys for now |
| `ADMIN_EMAILS`, `ANTHROPIC_API_KEY` | same as `.env.local` |
| `CRON_SECRET` | a new random string (see `.env.example`) |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-project>.vercel.app` (no trailing slash) |

4. **Deploy.** If the URL Vercel gives you differs from what you guessed, update
   `NEXT_PUBLIC_SITE_URL` and **redeploy** (NEXT_PUBLIC values are baked in at build time).

### 2. Connect the services
- **Paystack** → Settings → API Keys & Webhooks → *Test Webhook URL*:
  `https://<your-domain>/api/paystack/webhook`
- **Supabase** → Authentication → URL Configuration → *Site URL*: your live URL.
- The daily clean-up job (`vercel.json`) starts automatically after deploy.

### 3. Test on the live site (still test keys)
Place a Paystack order with the test card, then check Paystack → Developers/Logs
that the webhook returned **200**; place a pay-on-delivery order; walk an order
through admin; try `/track`, the laptop finder and a review.

### 4. Go live
1. Complete **Paystack business activation**, then switch to the `sk_live_` / `pk_live_`
   keys in Vercel, set the **Live Webhook URL**, and redeploy.
2. Replace placeholders in Admin → Settings (CAC number, Instagram), delete the
   sample review, and review the draft warranty / terms / privacy pages.
3. Optional: add a custom domain in Vercel → Settings → Domains, then update
   `NEXT_PUBLIC_SITE_URL`, the Paystack webhook URL and Supabase Site URL, and redeploy.

## Build stages

1. ✅ Setup, schema, migrations, RLS
2. ✅ Admin auth + CRUD (products with images, vendors, riders, zones, settings)
3. ✅ Storefront: home, listing, product page, cart
4. ✅ Checkout, orders, Paystack (test) + webhook, pay on delivery
5. ✅ Admin orders: status flow, assignment, WhatsApp, profit, dashboard
6. ✅ Order tracking, rate limits, security headers, error pages, clean-up job — deploy: see above
