# CLAUDE.md

## Project
Online IT gadget store for Lagos, Nigeria ("Gadget Store", name will change).
No-stock model: products are listed at our selling price; customer orders; admin
sources the item from a vendor **offline**; a rider picks up from the hub
(Computer Village, Ikeja) and delivers. Single admin. Customers never see or
choose vendors.

Owner knows JS/SQL/Firebase and is newer to Next.js. Keep code simple, typed
and commented, and briefly explain Next-specific patterns when introducing them.

## Stack
- Next.js 16 (App Router, TypeScript, Server Components + Server Actions), React 19
- Tailwind CSS v4 (config in `src/app/globals.css`, no tailwind.config)
- Supabase: Postgres, Auth (admin login only), Storage (`product-images` bucket)
- Paystack (test mode first), deploy on Vercel
- npm; Supabase CLI via `npx supabase`
- Next 16 differs from older versions (e.g. `middleware.ts` is now `proxy.ts`,
  `cookies()`/`params` are async). See @AGENTS.md — check `node_modules/next/dist/docs/`
  before writing Next-specific code.
- `cacheComponents` is deliberately **off** (classic rendering: pages reading
  cookies/searchParams are dynamic). Don't add `"use cache"` without discussing.
- zod v4 for form validation.

## Layout
```
src/app/                 routes (storefront, /admin, /api/paystack/*)
  admin/login/           login page + login/logout actions
  admin/(panel)/         all protected admin pages (route group = shared layout, not in URL)
    <entity>/page.tsx      list;  <entity>/[id]/page.tsx  edit ("new" = create)
    <entity>/actions.ts    Server Actions for that entity
  (store)/               storefront route group: layout (header/footer/WhatsApp), home,
                         products (list), products/[slug], cart, checkout
  robots.ts, sitemap.ts  SEO files
src/proxy.ts             refreshes Supabase session on /admin/*, redirects logged-out users
src/lib/supabase/public.ts  cookie-less anon client for cacheable storefront reads
src/lib/store.ts         storefront queries (getSettings, searchProducts, getProductBySlug…)
src/lib/products.ts      public Product type + toProduct() mapper for public_products rows
src/lib/cart.ts          localStorage cart (useSyncExternalStore): useCart, cartActions
src/lib/brand.ts         marketing copy (tagline, hero text)
src/lib/cart.shared.ts   cart constants usable from server code (MAX_QTY)
src/lib/paystack.ts      Paystack API (initialize, verify, webhook signature) — server only
src/lib/orders.ts        startPaystackPayment(), confirmPaystackPayment() (idempotent) — server only
src/app/(store)/checkout/actions.ts   placeOrder / retryPayment Server Actions (public, untrusted input)
src/app/(store)/order/[id]/           customer order page (UUID link; customer-safe columns only)
src/app/api/paystack/callback|webhook route handlers
src/app/admin/(panel)/orders/          list (tabs/search), [id] detail (StatusPanel, FulfilmentEditor), actions.ts
src/lib/order-flow.ts    allowed status transitions, REVENUE_STATUSES — UI + server both use it
src/lib/whatsapp-messages.ts  vendor / rider / customer message templates (admin only)
src/lib/dates.ts         Lagos-time period starts + formatting (servers run in UTC)
src/lib/laptop-finder.ts form options (use cases, budgets, brands) + LaptopAdvice type — shared
src/lib/laptop-advisor.ts  Claude call (claude-opus-5-5, structured output via zod, effort low,
                         server-side refusal fallback) — server only; returns null if no key / error
src/app/(store)/laptop-finder/  public form + results; actions.ts saves to laptop_requests
src/app/admin/(panel)/leads/    laptop finder leads: list, detail, follow-up status/notes
src/app/admin/(panel)/reviews/  approve / hide / delete customer reviews
src/app/(store)/review/[orderId]/  customer review form (link sent after delivery; signed photo upload)
src/app/(store)/{warranty-returns,buying-guide,terms,privacy}/  DRAFT policy pages (PolicyPage layout)
src/components/store/home/  TrustStrip, ShopBy (budget/need/brand), Reviews, StayInTouch
src/lib/shop-filters.ts  budget ranges (naira, used in URLs ?min=&max=)
src/lib/placeholders.ts  detects seeded placeholder business details (admin reminders)
src/lib/rate-limit.ts    rateLimit(name, limit, windowSeconds) for public actions (hashed IP, Postgres, fails open)
src/app/(store)/track/   order lookup by order number + phone → /order/<uuid> (with OrderProgress)
src/app/api/cron/cleanup/  daily: auto-cancel unpaid Paystack orders >24h (re-verified), prune rate limits
src/components/admin/ActionButton.tsx  button for a pre-bound Server Action (`action.bind(null, id)`)
src/components/store/    Header, Footer, ProductCard/Grid, ProductGallery, AddToCart, CartView, WhatsApp
src/lib/auth.ts          getAdminUser / requireAdmin / adminDb  ← admin data access layer
src/lib/forms.ts         FormState type, zod field helpers (nairaAmount, ngPhone…), dbErrorMessage
src/lib/phone.ts         Nigerian phone normalise (234…), display (0…), wa.me links
src/lib/images.ts        productImageUrl(path), upload limits
src/components/admin/    ActionForm, DeleteButton, PageHeader/Badge/EmptyState
src/components/ui/       Field/Checkbox, shared Tailwind class strings
src/lib/supabase/
  server.ts              acts as logged-in user (cookies + anon key) — auth checks, public reads
  admin.ts               service role, BYPASSES RLS — server only
  browser.ts             anon client for "use client" components
src/lib/env.ts           public env (NEXT_PUBLIC_*)
src/lib/env.server.ts    secrets (server-only)
src/lib/money.ts         kobo ↔ ₦ helpers
src/lib/constants.ts     enum labels (must match Postgres enums)
src/types/database.ts    generated by `npm run db:types` — don't hand-edit
supabase/migrations/     SQL migrations, timestamp-prefixed
```

## Conventions
- **Money is integer kobo everywhere** (DB `bigint`, TS `number`). Convert only
  for display (`formatNaira`) or admin input (`nairaToKobo`). Never floats in DB.
- **Never send `cost_price`, `vendor_id` or vendor details to public pages.**
  Storefront reads `public_products` view only. Admin pages may show them.
- **Admin pages and actions get their DB client only via `await adminDb()`**
  (auth check + service-role client). Every admin Server Action calls it itself —
  actions are public endpoints; the proxy/layout checks are not enough.
  `createAdminClient()` directly is only for public server flows (order creation, Paystack).
- Admin forms: Server Action `(prev: FormState, fd: FormData) => Promise<FormState>`,
  validate with zod + helpers in `lib/forms.ts`, return `{ error }` / `{ message }` or
  `redirect()`. Render with `<ActionForm>` (avoids React 19 auto-reset on errors).
  After mutations call `revalidatePath` (`"/", "layout"` when storefront data changed).
- Phones stored as `234XXXXXXXXXX` (normalise with `normalizeNgPhone`), shown as `0…`.
- Product images: browser uploads directly to Storage with a signed upload URL from
  `createImageUploadUrl`, then `addProductImage` records it. `sort_order` 0 = main image.
  Path format `<product_id>/<uuid>.<ext>`.
- Files using secrets must `import "server-only"`.
- **Order creation is server-side**: recompute prices from the DB; never trust
  prices, totals or delivery fees sent from the browser.
- **Payments are verified server-side** (Paystack verify API + HMAC-SHA512 webhook
  signature using `PAYSTACK_SECRET_KEY`). Store the actual Paystack fee in
  `orders.payment_fee`. Pay-on-delivery only when total ≤ `settings.pod_max_order_value`.
- Orders are created only via the `create_order(p_order, p_items)` SQL function
  (one transaction; service role only). Only product ids + qty come from the browser.
- Mark orders paid only through `confirmPaystackPayment()` — it re-verifies with
  Paystack, checks amount ≥ total and currency NGN, and is safe to call repeatedly.
  Each payment attempt needs a new reference (`newReference`); the order id is in
  Paystack metadata as a fallback lookup.
- Values imported by server code must not come from a `"use client"` file
  (you get a client reference, not the value) — put shared constants in a plain module.
- Laptop finder: only requirements go to the AI (never name/phone/email); in-store data comes
  from `public_products`; AI product ids are re-validated against the in-stock list. Leads are
  saved even when the AI fails. Limit: 3 requests per phone per 24h + honeypot field.
  Calendly link lives in `settings.calendly_url` (hidden when empty).
- Reviews: only delivered/completed orders, one per order, `pending` until approved; public reads
  via `public_reviews` view (approved only, no order link). Never publish invented reviews —
  `is_sample` rows are labelled "Sample" on the site and flagged in admin.
- Deals: `products.compare_at_price` ("was" price, must be > selling_price) → amber "-X%" badge.
- Money inputs: always `<MoneyInput>` (strict format + live preview); pre-fill with `koboToNairaInput`.
- Every PUBLIC Server Action calls `rateLimit(...)` first; public forms with free text get a hidden honeypot field.
- Order items snapshot name/price/cost at order time. `unit_cost` and `vendor_id`
  are prefilled from the product and adjusted by admin after sourcing.
- Status changes are logged automatically by a DB trigger into
  `order_status_history`; don't insert history rows manually for status changes.
- Profit = total − Σ(unit_cost × qty) − rider_cost − payment_fee (`order_profit` view).
- Revenue/profit stats count only `delivered` + `completed` orders (by created_at, Lagos time).
  "Real" orders = pay on delivery OR paid online; unpaid Paystack orders sit in the "Unpaid online" tab.
- Status changes go through `updateOrderStatus` (checks `canTransition` + guards: vendor on every
  item before vendor_confirmed, rider before rider_assigned, paid before completed).
  Notes are attached to the history row the trigger writes.
- Delivery fee comes from the chosen zone (priced by distance from the hub); admin
  can override `delivery_fee` / `rider_cost` per order after negotiating offline.
- Schema changes: new migration via `npx supabase migration new <name>`, never edit
  pushed migrations; update `constants.ts` if enums change; rerun `npm run db:types`.
- Storefront reads use `createPublicClient()` (no cookies) via `lib/store.ts`, so pages
  can be cached: home + product pages use `export const revalidate = 300` (ISR);
  `/products` is dynamic (searchParams). Admin mutations `revalidatePath("/", "layout")`.
- Cart prices are display-only; `CartView` re-fetches live price/stock from
  `public_products`. Checkout must recompute everything server-side.
- Mobile-first UI. WhatsApp number in `settings.whatsapp_number` (format `234…`, links via `wa.me`).
- Prefer Server Components; add `"use client"` only for interactivity (cart, forms with state).

## Brand & Design
Copy: tagline **"Enjoy your work"**. Selling points: **vetted & trusted vendors**,
**fast delivery** across Lagos. (Brand name "Gadget Store" is temporary.)

Tokens live in `src/app/globals.css` (`@theme`). **Never hard-code hex values or
use raw Tailwind palettes (blue/green/red/amber/gray) in components** — use:
- `brand-50…950` built on the logo blue (500 = #0280F1 logo; 600 = #0270D6 for buttons/links — logo blue fails AA for text), `accent` (amber),
  `success` / `warning` / `danger` (+ `-50` tint, `-700` text), and `slate-*` neutrals.

Colour roles:
- Page bg white; subtle sections/cards `slate-50`; borders `slate-200`
- Headings `slate-900`, body `slate-700`, muted/labels `slate-500`
- Links `text-brand-600 hover:text-brand-700` (`linkCls`); focus rings `ring-brand-500` — always keep visible focus
- Selected chips / light highlights `bg-brand-100 text-brand-800`
- Prices `slate-900` bold (or `brand-700`) — never amber
- Hero banner + footer: `bg-brand-900 text-white`
- **Amber `accent` ONLY for "Hot deal" / "Featured" / discount badges** (dark text on it)
- WhatsApp buttons only: `bg-whatsapp` for the icon-only float, `bg-whatsapp-700
  hover:bg-whatsapp-800` for buttons with text (AA contrast)
- White dominates; blue is for buttons, links, prices, key highlights — not big blocks

Status colours (only for status, same everywhere — mappings in `components/ui/Badge.tsx`):
- success: in stock, delivered, completed, paid
- warning: pending, new order awaiting action
- danger: out of stock, cancelled, returned, payment failed, form errors
- brand: in-progress (vendor_confirmed, rider_assigned, picked_up)
- Badges = light bg + dark text of the same colour (`bg-success-50 text-success-700`)

Shared components — use these, don't restyle ad hoc:
- `components/ui/Button.tsx`: `<Button variant="primary|secondary|danger|ghost" size="sm|md|lg">`,
  `<ButtonLink href>`, `buttonClasses()` for other elements. One primary style app-wide.
- `components/ui/Badge.tsx`: `<Badge tone>`, `<OrderStatusBadge>`, `<StockBadge>`, `*_TONE` maps
- `components/ui/Alert.tsx`: `<Alert tone="success|warning|danger|info">`
- `components/ui/Field.tsx`: `<Field>`, `<Checkbox>`; `components/ui/styles.ts`: `inputCls`,
  `cardCls`, `linkCls`, table classes
- Text contrast must meet WCAG AA (why status text uses the `-700` shades).

## Commands
- `npm run dev` / `npm run build` / `npm run lint`
- `npm run db:push` — apply migrations to the linked hosted project (CLI v3 needs `--remote`; without it, it targets a local Docker DB)
- `npm run db:types` — regenerate DB types

## Build stages
Work stage by stage and stop for review after each:
1. ✅ Setup, schema, RLS, README
2. ✅ Admin auth + CRUD (products + images, vendors, riders, zones, settings)
3. ✅ Storefront: home (landing), listing/search, product page, cart (localStorage), SEO
4. ✅ Checkout, order creation, Paystack + webhook, pay on delivery
5. ✅ Admin orders: status flow, assignment, WhatsApp buttons, profit, dashboard
6. ✅ Order tracking, hardening (rate limits, headers, honeypots), error/loading pages, daily clean-up cron — deploy steps in README
