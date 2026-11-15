import type { Metadata } from "next";
import Link from "next/link";
import { adminDb } from "@/lib/auth";
import { formatLagosDateTime } from "@/lib/dates";
import { USE_CASES, type UseCase } from "@/lib/laptop-finder";
import { formatNaira } from "@/lib/money";
import { formatNgPhone } from "@/lib/phone";
import { EmptyState, PageHeader } from "@/components/admin/PageHeader";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { linkCls, tableCls, tableWrapCls, tbodyCls, theadCls } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Laptop leads" };

export const LEAD_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  new: { label: "New", tone: "warning" },
  contacted: { label: "Contacted", tone: "brand" },
  closed: { label: "Closed", tone: "neutral" },
};

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "open" } = await searchParams;
  const db = await adminDb();

  let query = db
    .from("laptop_requests")
    .select("id, created_at, name, phone, use_case, budget_max, status, ai_suggestions")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status === "open") query = query.neq("status", "closed");
  else if (status in LEAD_STATUS) query = query.eq("status", status);
  const { data: leads, error } = await query;
  if (error) throw error;

  const filters = [
    ["open", "Open"],
    ["new", "New"],
    ["contacted", "Contacted"],
    ["closed", "Closed"],
    ["all", "All"],
  ];

  return (
    <>
      <PageHeader title="Laptop leads" />
      <p className="-mt-4 mb-4 text-sm text-slate-500">Customers who used the laptop finder. Call or WhatsApp them to help them choose.</p>

      <nav aria-label="Lead filters" className="mb-4 flex flex-wrap gap-2">
        {filters.map(([key, label]) => (
          <Link
            key={key}
            href={`/admin/leads?status=${key}`}
            aria-current={status === key ? "page" : undefined}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              status === key ? "border-brand-200 bg-brand-100 font-medium text-brand-800" : "border-slate-200 bg-white text-slate-700 hover:border-brand-300"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {leads.length === 0 ? (
        <EmptyState>No leads here yet.</EmptyState>
      ) : (
        <div className={tableWrapCls}>
          <table className={tableCls}>
            <thead className={theadCls}>
              <tr>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Needs</th>
                <th className="px-4 py-2">Budget</th>
                <th className="px-4 py-2">In-store match</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className={tbodyCls}>
              {leads.map((l) => {
                const matches = ((l.ai_suggestions as { in_store?: unknown[] } | null)?.in_store ?? []).length;
                const st = LEAD_STATUS[l.status] ?? LEAD_STATUS.new;
                return (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <Link href={`/admin/leads/${l.id}`} className={`${linkCls} font-medium`}>{l.name}</Link>
                      <span className="block text-xs text-slate-500">
                        {formatNgPhone(l.phone)} · {formatLagosDateTime(l.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-700">{USE_CASES[l.use_case as UseCase] ?? l.use_case}</td>
                    <td className="px-4 py-2 text-slate-900">≤ {formatNaira(l.budget_max)}</td>
                    <td className="px-4 py-2">
                      {matches ? <Badge tone="success">{matches} in stock</Badge> : <Badge tone="warning">Needs sourcing</Badge>}
                    </td>
                    <td className="px-4 py-2"><Badge tone={st.tone}>{st.label}</Badge></td>
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
