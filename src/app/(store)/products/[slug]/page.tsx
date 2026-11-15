import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ShieldCheck, Truck, Wallet } from "lucide-react";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
import { publicEnv } from "@/lib/env";
import { formatNaira } from "@/lib/money";
import { waLink } from "@/lib/phone";
import { getProductBySlug, getRelatedProducts, getSettings } from "@/lib/store";
import { Badge, StockBadge } from "@/components/ui/Badge";
import { AddToCart } from "@/components/store/AddToCart";
import { ProductGallery } from "@/components/store/ProductGallery";
import { ProductGrid } from "@/components/store/ProductCard";
import { WhatsAppIcon } from "@/components/store/WhatsApp";

type Props = { params: Promise<{ slug: string }> };

// ISR for dynamic routes: returning [] means "don't pre-build any product at
// build time" — each product page is built on its first visit, then cached
// and refreshed at most every 5 minutes (or instantly when admin edits it).
export const revalidate = 300;
export async function generateStaticParams() {
  return [];
}

// Per-product SEO: <title>, description and social-share image.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug); // cached — not a second DB call
  if (!product) return { title: "Product not found" };

  const description =
    (product.description?.slice(0, 155) ??
      `${CONDITIONS[product.condition]} ${product.name}`) + ` — ${formatNaira(product.price)}, delivered in Lagos.`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [settings, related] = await Promise.all([getSettings(), getRelatedProducts(product)]);
  const soldOut = product.stockStatus === "out_of_stock";
  const url = `${publicEnv.siteUrl}/products/${product.slug}`;

  const askLink = waLink(
    settings.whatsappNumber,
    `Hi ${settings.storeName}, I'm interested in: ${product.name} (${formatNaira(product.price)})\n${url}`,
  );

  // Structured data so Google can show price/availability in search results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((i) => i.url),
    description: product.description ?? undefined,
    itemCondition:
      product.condition === "new"
        ? "https://schema.org/NewCondition"
        : product.condition === "refurbished"
          ? "https://schema.org/RefurbishedCondition"
          : "https://schema.org/UsedCondition",
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "NGN",
      price: (product.price / 100).toFixed(2),
      availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <script
        type="application/ld+json"
        // Escape "<" so product text can't break out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-brand-700">Home</Link>
          </li>
          <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
          <li>
            <Link href={`/products?category=${product.category}`} className="hover:text-brand-700">
              {CATEGORIES[product.category]}
            </Link>
          </li>
          <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
          <li aria-current="page" className="line-clamp-1 text-slate-700">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">{CONDITIONS[product.condition]}</Badge>
            <StockBadge status={product.stockStatus} />
          </div>
          <h1 className="text-2xl font-bold md:text-3xl">{product.name}</h1>
          <p className="text-3xl font-bold text-slate-900">{formatNaira(product.price)}</p>

          <AddToCart
            disabled={soldOut}
            product={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              image: product.images[0]?.url ?? null,
            }}
          />

          <a
            href={askLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Ask about this item on WhatsApp
          </a>

          <ul className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <li className="flex gap-2">
              <ShieldCheck className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
              <span>
                <strong className="text-slate-900">Warranty:</strong>{" "}
                {product.warranty ?? "Ask us on WhatsApp for warranty details."}
              </span>
            </li>
            <li className="flex gap-2">
              <Truck className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
              <span>Fast delivery across Lagos — fee shown at checkout.</span>
            </li>
            <li className="flex gap-2">
              <Wallet className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
              <span>
                Pay online with Paystack
                {product.price <= settings.podMaxOrderValue ? ", or pay on delivery." : "."}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Specs + description */}
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {product.specs.length > 0 && (
          <section aria-labelledby="specs-heading">
            <h2 id="specs-heading" className="mb-3 text-xl font-bold">Specifications</h2>
            <dl className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
              {product.specs.map((s) => (
                <div key={s.label} className="grid grid-cols-[40%_1fr] gap-2 px-4 py-2.5 text-sm odd:bg-slate-50">
                  <dt className="font-medium text-slate-500">{s.label}</dt>
                  <dd className="text-slate-900">{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
        {product.description && (
          <section aria-labelledby="desc-heading">
            <h2 id="desc-heading" className="mb-3 text-xl font-bold">Description</h2>
            <p className="whitespace-pre-line text-slate-700">{product.description}</p>
          </section>
        )}
      </div>

      {related.length > 0 && (
        <section className="mt-12" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-4 text-xl font-bold">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
