import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, type Category } from "@/lib/constants";
import { searchProducts, type ProductSort } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { inputCls } from "@/components/ui/styles";
import { ProductGrid } from "@/components/store/ProductCard";

type SearchParams = { q?: string; category?: string; sort?: string };

const SORTS: Record<ProductSort, string> = {
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
};

function isCategory(v: string | undefined): v is Category {
  return !!v && v in CATEGORIES;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { category, q } = await searchParams;
  const title = q ? `Search: ${q}` : isCategory(category) ? CATEGORIES[category] : "All products";
  return {
    title,
    description: isCategory(category)
      ? `Shop ${CATEGORIES[category].toLowerCase()} in Lagos — vetted vendors, fast delivery.`
      : "Shop laptops, accessories, networking and power gear in Lagos.",
    // Search result pages shouldn't be indexed; category pages should.
    robots: q ? { index: false } : undefined,
  };
}

// Reading searchParams makes this page render per request (dynamic).
export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const category = isCategory(params.category) ? params.category : undefined;
  const sort: ProductSort = params.sort && params.sort in SORTS ? (params.sort as ProductSort) : "newest";

  const products = await searchProducts({ q, category, sort });

  /** Build a /products URL keeping the other current filters. */
  const href = (next: Partial<SearchParams>) => {
    const sp = new URLSearchParams();
    const merged = { q, category, sort: sort === "newest" ? undefined : sort, ...next };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const s = sp.toString();
    return s ? `/products?${s}` : "/products";
  };

  const heading = q ? `Results for “${q}”` : category ? CATEGORIES[category] : "All products";

  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
      active
        ? "border-brand-200 bg-brand-100 font-medium text-brand-800"
        : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:text-brand-700"
    }`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold md:text-3xl">{heading}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {products.length} item{products.length === 1 ? "" : "s"}
      </p>

      {/* Category chips */}
      <nav aria-label="Filter by category" className="-mx-4 mt-6 overflow-x-auto px-4">
        <ul className="flex gap-2">
          <li>
            <Link href={href({ category: undefined })} className={chip(!category)} aria-current={!category ? "page" : undefined}>
              All
            </Link>
          </li>
          {(Object.entries(CATEGORIES) as [Category, string][]).map(([value, label]) => (
            <li key={value}>
              <Link
                href={href({ category: value })}
                className={chip(category === value)}
                aria-current={category === value ? "page" : undefined}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Search + sort (GET form → updates the URL) */}
      <form action="/products" className="mt-4 flex flex-wrap gap-2">
        {category && <input type="hidden" name="category" value={category} />}
        <label className="sr-only" htmlFor="list-q">
          Search
        </label>
        <input id="list-q" name="q" type="search" defaultValue={q} placeholder="Search…" className={`${inputCls} min-w-0 flex-1 sm:max-w-xs`} />
        <label className="sr-only" htmlFor="list-sort">
          Sort by
        </label>
        <select id="list-sort" name="sort" defaultValue={sort} className={`${inputCls} w-auto`}>
          {Object.entries(SORTS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
      </form>

      <div className="mt-6">
        {products.length ? (
          <ProductGrid products={products} />
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="font-medium text-slate-900">No products found</p>
            <p className="mt-1 text-sm text-slate-500">Try a different search or category.</p>
            <Link href="/products" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline">
              Clear filters
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
