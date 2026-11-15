import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { adminDb } from "@/lib/auth";
import { CATEGORIES, CONDITIONS, type Category } from "@/lib/constants";
import { productImageUrl } from "@/lib/images";
import { formatNaira } from "@/lib/money";
import { EmptyState, PageHeader } from "@/components/admin/PageHeader";
import { Badge, StockBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { inputCls, tableCls, tableWrapCls, tbodyCls, theadCls } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q = "", category = "" } = await searchParams;
  const db = await adminDb();

  let query = db
    .from("products")
    .select(
      "id, name, category, condition, selling_price, cost_price, stock_status, is_active, is_featured, vendors(name), product_images(storage_path)",
    )
    .order("created_at", { ascending: false })
    .order("sort_order", { referencedTable: "product_images" })
    .limit(1, { referencedTable: "product_images" });

  if (q) query = query.ilike("name", `%${q.replace(/[%_]/g, "")}%`);
  if (category in CATEGORIES) query = query.eq("category", category as Category);

  const { data: products, error } = await query;
  if (error) throw error;

  return (
    <>
      <PageHeader title="Products" newHref="/admin/products/new" newLabel="Add product" />

      {/* A plain GET form: submitting it just changes the URL's ?q=&category= */}
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search by name…" className={`${inputCls} max-w-xs`} />
        <select name="category" defaultValue={category} className={`${inputCls} w-auto`}>
          <option value="">All categories</option>
          {Object.entries(CATEGORIES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      {products.length === 0 ? (
        <EmptyState>{q || category ? "No products match." : "No products yet."}</EmptyState>
      ) : (
        <div className={tableWrapCls}>
          <table className={tableCls}>
            <thead className={theadCls}>
              <tr>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2 text-right">Cost</th>
                <th className="px-4 py-2 text-right">Margin</th>
                <th className="px-4 py-2">Vendor</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className={tbodyCls}>
              {products.map((p) => {
                const img = p.product_images[0];
                const margin = p.selling_price - p.cost_price;
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <Link href={`/admin/products/${p.id}`} className="group flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-slate-100">
                          {img && (
                            <Image
                              src={productImageUrl(img.storage_path)}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <span className="font-medium text-brand-600 group-hover:text-brand-700 group-hover:underline">
                          {p.name}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {CATEGORIES[p.category]}
                      <span className="block text-xs">{CONDITIONS[p.condition]}</span>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-slate-900">
                      {formatNaira(p.selling_price)}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-600">{formatNaira(p.cost_price)}</td>
                    <td className={`px-4 py-2 text-right ${margin < 0 ? "text-danger-700" : "text-success-700"}`}>
                      {formatNaira(margin)}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{p.vendors?.name ?? "—"}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {!p.is_active && <Badge tone="neutral">Hidden</Badge>}
                        <StockBadge status={p.stock_status} />
                        {p.is_featured && <Badge tone="accent">Featured</Badge>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
