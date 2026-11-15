import type { Metadata } from "next";
import Link from "next/link";
import { adminDb } from "@/lib/auth";
import { formatLagosDateTime } from "@/lib/dates";
import { formatNaira } from "@/lib/money";
import { IN_PROGRESS_STATUSES, REVENUE_STATUSES } from "@/lib/order-flow";
import { formatNgPhone, normalizeNgPhone } from "@/lib/phone";
import { EmptyState, PageHeader } from "@/components/admin/PageHeader";
import { Badge, OrderStatusBadge, PAYMENT_STATUS_TONE } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { inputCls, linkCls, tableCls, tableWrapCls, tbodyCls, theadCls } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Orders" };

const TABS = {
  action: "Needs action",
  progress: "In progress",
  done: "Delivered",
  closed: "Cancelled / returned",
  unpaid: "Unpaid online",
  all: "All",
} as const;
type Tab = keyof typeof TABS;

const PAYMENT_LABEL = { pending: "Unpaid", paid: "Paid", failed: "Failed", refunded: "Refunded" } as const;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const tab: Tab = sp.tab && sp.tab in TABS ? (sp.tab as Tab) : "action";
  const q = (sp.q ?? "").replace(/[%_,().*:"\\]/g, " ").trim();
  const db = await adminDb();

  /**
   * Each tab is a filter. "Needs action" = new orders that are real:
   * pay-on-delivery, or Paystack and actually paid. Unpaid Paystack orders
   * (abandoned checkouts) live in their own tab so they don't clutter.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- query builder type is long; filters below are typed by column name
  const applyTab = (query: any, t: Tab) => {
    switch (t) {
      case "action":
        return query.eq("status", "new").or("payment_method.eq.pay_on_delivery,payment_status.eq.paid");
      case "progress":
        return query.in("status", IN_PROGRESS_STATUSES);
      case "done":
        return query.in("status", REVENUE_STATUSES);
      case "closed":
        return query.in("status", ["cancelled", "returned"]);
      case "unpaid":
        return query.eq("status", "new").eq("payment_method", "paystack").neq("payment_status", "paid");
      default:
        return query;
    }
  };

  let listQuery = applyTab(
    db
      .from("orders")
      .select(
        "id, order_number, created_at, customer_name, customer_phone, zone_name, total, payment_method, payment_status, status",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    q ? "all" : tab, // searching looks across every tab
  );
  if (q) {
    const phone = normalizeNgPhone(q);
    listQuery = listQuery.or(
      [`order_number.ilike.%${q}%`, `customer_name.ilike.%${q}%`, `customer_phone.ilike.%${phone ?? q}%`].join(","),
    );
  }

  // Counts for the tab badges (head:true = count only, no rows).
  const countFor = (t: Tab) =>
    applyTab(db.from("orders").select("id", { count: "exact", head: true }), t).then(
      (r: { count: number | null }) => r.count ?? 0,
    );

  const [{ data: orders, error }, ...counts] = await Promise.all([
    listQuery,
    ...(Object.keys(TABS) as Tab[]).map(countFor),
  ]);
  if (error) throw error;
  const tabCounts = Object.fromEntries((Object.keys(TABS) as Tab[]).map((t, i) => [t, counts[i] as number]));

  // Profit per order from the order_profit view.
  type Row = {
    id: string; order_number: string; created_at: string; customer_name: string; customer_phone: string;
    zone_name: string | null; total: number; payment_method: "paystack" | "pay_on_delivery";
    payment_status: keyof typeof PAYMENT_LABEL; status: Parameters<typeof OrderStatusBadge>[0]["status"];
  };
  const rows = (orders ?? []) as Row[];
  const { data: profits } = rows.length
    ? await db.from("order_profit").select("order_id, profit").in("order_id", rows.map((o) => o.id))
    : { data: [] };
  const profitById = new Map((profits ?? []).map((p) => [p.order_id, p.profit ?? 0]));

  return (
    <>
      <PageHeader title="Orders" />

      <form className="mb-4 flex flex-wrap gap-2">
        <input type="hidden" name="tab" value={tab} />
        <label htmlFor="order-q" className="sr-only">Search orders</label>
        <input
          id="order-q"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Order number, name or phone…"
          className={`${inputCls} max-w-xs`}
        />
        <Button type="submit" variant="secondary">Search</Button>
        {q && <Link href={`/admin/orders?tab=${tab}`} className={`${linkCls} self-center text-sm`}>Clear</Link>}
      </form>

      {!q && (
        <nav aria-label="Order filters" className="-mx-4 mb-4 overflow-x-auto px-4">
          <ul className="flex gap-2">
            {(Object.entries(TABS) as [Tab, string][]).map(([key, label]) => {
              const active = key === tab;
              return (
                <li key={key}>
                  <Link
                    href={`/admin/orders?tab=${key}`}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
                      active
                        ? "border-brand-200 bg-brand-100 font-medium text-brand-800"
                        : "border-slate-200 bg-white text-slate-700 hover:border-brand-300"
                    }`}
                  >
                    {label}
                    {key !== "all" && (
                      <span className={`rounded-full px-1.5 text-xs ${active ? "bg-white" : "bg-slate-100"}`}>
                        {tabCounts[key]}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {rows.length === 0 ? (
        <EmptyState>{q ? "No orders match your search." : "No orders here."}</EmptyState>
      ) : (
        <div className={tableWrapCls}>
          <table className={tableCls}>
            <thead className={theadCls}>
              <tr>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2 text-right">Profit</th>
                <th className="px-4 py-2">Payment</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className={tbodyCls}>
              {rows.map((o) => {
                const profit = profitById.get(o.id) ?? 0;
                return (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <Link href={`/admin/orders/${o.id}`} className={`${linkCls} font-mono font-medium`}>
                        {o.order_number}
                      </Link>
                      <span className="block text-xs text-slate-500">{formatLagosDateTime(o.created_at)}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-slate-900">{o.customer_name}</span>
                      <span className="block text-xs text-slate-500">
                        {formatNgPhone(o.customer_phone)}
                        {o.zone_name ? ` · ${o.zone_name}` : ""}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-slate-900">{formatNaira(o.total)}</td>
                    <td className={`px-4 py-2 text-right ${profit < 0 ? "text-danger-700" : "text-success-700"}`}>
                      {formatNaira(profit)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={PAYMENT_STATUS_TONE[o.payment_status]}>{PAYMENT_LABEL[o.payment_status]}</Badge>
                        <Badge tone="neutral">{o.payment_method === "paystack" ? "Paystack" : "On delivery"}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <OrderStatusBadge status={o.status} />
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
