import type { Metadata } from "next";
import Link from "next/link";
import { adminDb } from "@/lib/auth";
import { formatLagosDateTime, lagosPeriodStart } from "@/lib/dates";
import { formatNaira } from "@/lib/money";
import { IN_PROGRESS_STATUSES, REVENUE_STATUSES } from "@/lib/order-flow";
import { placeholderFields } from "@/lib/placeholders";
import { EmptyState } from "@/components/admin/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { cardCls, linkCls, tableCls, tableWrapCls, tbodyCls, theadCls } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Dashboard" };

type Range = "week" | "month";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: r } = await searchParams;
  const range: Range = r === "month" ? "month" : "week";
  const db = await adminDb();

  const todayStart = lagosPeriodStart("day").toISOString();
  const rangeStart = lagosPeriodStart(range).toISOString();

  // A "real" order = pay on delivery, or paid online (skips abandoned checkouts).
  const realOrder = "payment_method.eq.pay_on_delivery,payment_status.eq.paid";

  const [todayRes, actionRes, progressRes, revenueRes, recentRes] = await Promise.all([
    db.from("orders").select("id", { count: "exact", head: true }).gte("created_at", todayStart).or(realOrder),
    db.from("orders").select("id", { count: "exact", head: true }).eq("status", "new").or(realOrder),
    db.from("orders").select("id", { count: "exact", head: true }).in("status", IN_PROGRESS_STATUSES),
    // Revenue & profit: delivered/completed orders placed in the period.
    db.from("order_profit").select("total, profit").in("status", REVENUE_STATUSES).gte("created_at", rangeStart),
    db
      .from("orders")
      .select("id, order_number, created_at, customer_name, total, status")
      .or(realOrder)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const counted = revenueRes.data ?? [];
  const revenue = counted.reduce((s, o) => s + (o.total ?? 0), 0);
  const profit = counted.reduce((s, o) => s + (o.profit ?? 0), 0);
  const margin = revenue ? Math.round((profit / revenue) * 100) : 0;
  const label = range === "week" ? "this week" : "this month";
  const needsAction = actionRes.count ?? 0;

  const cards: { label: string; value: string; href?: string; sub?: string; valueCls?: string }[] = [
    { label: "Orders today", value: String(todayRes.count ?? 0), href: "/admin/orders?tab=all" },
    {
      label: "Needs action",
      value: String(needsAction),
      href: "/admin/orders?tab=action",
      valueCls: needsAction > 0 ? "text-warning-700" : undefined,
    },
    { label: "In progress", value: String(progressRes.count ?? 0), href: "/admin/orders?tab=progress" },
    {
      label: `Revenue ${label}`,
      value: formatNaira(revenue),
      sub: `${counted.length} delivered order${counted.length === 1 ? "" : "s"}`,
    },
    {
      label: `Profit ${label}`,
      value: formatNaira(profit),
      sub: `${margin}% margin`,
      valueCls: profit < 0 ? "text-danger-700" : "text-success-700",
    },
  ];

  const recent = recentRes.data ?? [];

  // "Before launch" reminders: placeholder business details + sample reviews.
  const [{ data: settingsRow }, { count: sampleReviews }] = await Promise.all([
    db.from("settings").select("cac_number, business_address, instagram_handle").single(),
    db.from("reviews").select("id", { count: "exact", head: true }).eq("is_sample", true),
  ]);
  const placeholders = settingsRow ? placeholderFields(settingsRow) : [];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-sm" role="group" aria-label="Period">
          {(["week", "month"] as Range[]).map((opt) => (
            <Link
              key={opt}
              href={`/admin?range=${opt}`}
              aria-current={range === opt ? "true" : undefined}
              className={`rounded px-3 py-1 ${
                range === opt ? "bg-brand-100 font-medium text-brand-800" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              This {opt}
            </Link>
          ))}
        </div>
      </div>

      {(placeholders.length > 0 || (sampleReviews ?? 0) > 0) && (
        <div className="mb-6">
          <Alert tone="warning">
            <strong>Before launch:</strong>{" "}
            {placeholders.length > 0 && (
              <>
                replace the placeholder {placeholders.join(", ")} in{" "}
                <Link href="/admin/settings" className="underline">Settings</Link>.{" "}
              </>
            )}
            {(sampleReviews ?? 0) > 0 && (
              <>
                Delete the sample review in <Link href="/admin/reviews?tab=approved" className="underline">Reviews</Link>.{" "}
              </>
            )}
            Review the draft <Link href="/warranty-returns" className="underline">warranty</Link>,{" "}
            <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy</Link> pages.
          </Alert>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => {
          const body = (
            <>
              <p className="text-sm text-slate-500">{c.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${c.valueCls ?? "text-slate-900"}`}>{c.value}</p>
              {c.sub && <p className="mt-0.5 text-xs text-slate-500">{c.sub}</p>}
            </>
          );
          return c.href ? (
            <Link key={c.label} href={c.href} className={`${cardCls} hover:border-brand-300`}>
              {body}
            </Link>
          ) : (
            <div key={c.label} className={cardCls}>
              {body}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Revenue and profit count delivered &amp; completed orders placed {label} (Lagos time).
      </p>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Recent orders</h2>
      {recent.length === 0 ? (
        <EmptyState>No orders yet.</EmptyState>
      ) : (
        <div className={tableWrapCls}>
          <table className={tableCls}>
            <thead className={theadCls}>
              <tr>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className={tbodyCls}>
              {recent.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link href={`/admin/orders/${o.id}`} className={`${linkCls} font-mono font-medium`}>
                      {o.order_number}
                    </Link>
                    <span className="block text-xs text-slate-500">{formatLagosDateTime(o.created_at)}</span>
                  </td>
                  <td className="px-4 py-2 text-slate-900">{o.customer_name}</td>
                  <td className="px-4 py-2 text-right font-semibold text-slate-900">{formatNaira(o.total!)}</td>
                  <td className="px-4 py-2">
                    <OrderStatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
