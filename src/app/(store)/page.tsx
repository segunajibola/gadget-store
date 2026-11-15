/**
 * Home page = landing page. Sells the business first (hero, why us), then
 * shows categories and products as the visitor scrolls.
 */
import Link from "next/link";
import { BadgeCheck, ChevronRight, ClipboardCheck, PackageCheck, ShieldCheck, Truck, Wallet, Bike } from "lucide-react";
import { CATEGORIES, type Category } from "@/lib/constants";
import { HERO, HUB_LABEL, TAGLINE } from "@/lib/brand";
import { formatNaira } from "@/lib/money";
import { waLink } from "@/lib/phone";
import { getFeaturedProducts, getNewestProducts, getSettings } from "@/lib/store";
import { ButtonLink } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/store/CategoryIcon";
import { ProductGrid } from "@/components/store/ProductCard";
import { WhatsAppIcon } from "@/components/store/WhatsApp";

// ISR: serve a cached copy, rebuild at most every 5 minutes. Admin edits
// clear the cache immediately via revalidatePath().
export const revalidate = 300;

export default async function HomePage() {
  const [settings, featured, newest] = await Promise.all([
    getSettings(),
    getFeaturedProducts(8),
    getNewestProducts(8),
  ]);
  const showcase = featured.length ? featured : newest;
  const chatLink = waLink(settings.whatsappNumber, `Hi ${settings.storeName}, I need help choosing a gadget.`);

  const reasons = [
    {
      icon: ShieldCheck,
      title: "Vetted & trusted vendors",
      text: `We only source from vendors we've checked and trust in ${HUB_LABEL}.`,
    },
    {
      icon: Truck,
      title: "Fast Lagos delivery",
      text: "Our riders pick up and deliver straight to your door across Lagos.",
    },
    {
      icon: Wallet,
      title: "Pay online or on delivery",
      text: `Pay securely with Paystack, or pay on delivery for orders up to ${formatNaira(settings.podMaxOrderValue)}.`,
    },
    {
      icon: BadgeCheck,
      title: "No surprises",
      text: "Every listing shows its condition — New, UK-used or Refurbished — and warranty.",
    },
  ];

  const steps = [
    { icon: ClipboardCheck, title: "Order online", text: "Add to cart and check out in minutes." },
    { icon: PackageCheck, title: "We confirm", text: "We confirm your item with a vetted vendor." },
    { icon: Bike, title: "Rider picks up", text: `Collected from ${HUB_LABEL}.` },
    { icon: Truck, title: "Delivered", text: "Brought to your door. Enjoy your work." },
  ];

  const faqs = [
    {
      q: "What do New, UK-used and Refurbished mean?",
      a: "New items are brand new and sealed. UK-used items are pre-owned imports in good working condition. Refurbished items have been repaired or restored and tested. Each listing states its condition clearly.",
    },
    {
      q: "Do items come with a warranty?",
      a: "Warranty depends on the item and is shown on each product page. Ask us on WhatsApp if you need details before buying.",
    },
    {
      q: "How fast is delivery and how much does it cost?",
      a: "We deliver across Lagos from Computer Village, Ikeja. The delivery fee depends on your area and is shown at checkout before you pay.",
    },
    {
      q: "How can I pay?",
      a: `Pay online with card, bank transfer or USSD through Paystack, or pay on delivery for orders up to ${formatNaira(settings.podMaxOrderValue)}.`,
    },
  ];

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="bg-brand-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.2fr_1fr] md:items-center md:py-20">
          <div>
            {/* The tagline finishes the headline sentence, emphasised in italics */}
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              {HERO.headline} <em className="text-brand-300">{TAGLINE.toLowerCase()}</em>.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-brand-100">{HERO.subhead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/products" size="lg">
                Shop now
              </ButtonLink>
              <a
                href={chatLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-white/40 px-6 py-3 font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Chat on WhatsApp
              </a>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
            {reasons.slice(0, 2).map((r) => (
              <li key={r.title} className="flex gap-3 rounded-lg bg-brand-800/60 p-4">
                <r.icon className="h-6 w-6 shrink-0 text-brand-300" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-white">{r.title}</p>
                  <p className="text-sm text-brand-100">{r.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Why us ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="why-heading">
        <h2 id="why-heading" className="text-2xl font-bold">
          Why buy from us
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((r) => (
            <li key={r.title} className="rounded-lg border border-slate-200 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-50">
                <r.icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
              </span>
              <p className="mt-3 font-semibold text-slate-900">{r.title}</p>
              <p className="mt-1 text-sm text-slate-500">{r.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Categories ---------- */}
      <section className="bg-slate-50" aria-labelledby="cat-heading">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 id="cat-heading" className="text-2xl font-bold">
            Shop by category
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {(Object.entries(CATEGORIES) as [Category, string][]).map(([value, label]) => (
              <li key={value}>
                <Link
                  href={`/products?category=${value}`}
                  className="flex h-full flex-col items-center gap-3 rounded-lg border border-slate-200 bg-white p-5 text-center transition hover:border-brand-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <CategoryIcon category={value} className="h-8 w-8 text-brand-600" />
                  <span className="font-medium text-slate-900">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Products ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="products-heading">
        <div className="flex items-end justify-between gap-4">
          <h2 id="products-heading" className="text-2xl font-bold">
            {featured.length ? "Featured gear" : "Latest arrivals"}
          </h2>
          <Link href="/products" className="inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-700">
            View all <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-6">
          {showcase.length ? (
            <ProductGrid products={showcase} />
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
              New stock is on the way. Check back soon, or ask us on WhatsApp.
            </p>
          )}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="bg-slate-50" aria-labelledby="how-heading">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 id="how-heading" className="text-2xl font-bold">
            How it works
          </h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <s.icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
                </div>
                <p className="mt-3 font-semibold text-slate-900">{s.title}</p>
                <p className="mt-1 text-sm text-slate-500">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="mx-auto max-w-3xl px-4 py-12" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-2xl font-bold">
          Frequently asked questions
        </h2>
        {/* <details> gives an accessible accordion with no JavaScript;
            the "faq" class adds the open/close animation (globals.css). */}
        <div className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200">
          {faqs.map((f) => (
            <details key={f.q} className="faq group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 font-medium text-slate-900 transition-colors hover:bg-slate-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </summary>
              <p className="faq-answer px-4 pb-4 text-sm text-slate-700">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-start gap-4 rounded-xl border border-brand-200 bg-brand-50 p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold">Not sure what to buy?</h2>
            <p className="mt-1 text-slate-700">Tell us what you need it for and your budget — we&apos;ll recommend something.</p>
          </div>
          <a
            href={chatLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-whatsapp-700 px-6 py-3 font-medium text-white transition hover:bg-whatsapp-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Chat on WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
