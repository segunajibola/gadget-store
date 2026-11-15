import type { Metadata } from "next";
import Link from "next/link";
import { adminDb } from "@/lib/auth";
import { formatNaira } from "@/lib/money";
import { EmptyState, PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { linkCls, tableCls, tableWrapCls, tbodyCls, theadCls } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Delivery zones" };

export default async function ZonesPage() {
  const db = await adminDb();
  const { data: zones, error } = await db
    .from("zones")
    .select("*")
    .order("sort_order")
    .order("name");
  if (error) throw error;

  return (
    <>
      <PageHeader title="Delivery zones" newHref="/admin/zones/new" newLabel="Add zone" />
      <p className="mb-4 text-sm text-slate-600">
        Priced by distance from the hub. Customers pick a zone at checkout; you can still adjust
        the fee on each order.
      </p>
      {zones.length === 0 ? (
        <EmptyState>No zones yet.</EmptyState>
      ) : (
        <div className={tableWrapCls}>
          <table className={tableCls}>
            <thead className={theadCls}>
              <tr>
                <th className="px-4 py-2">Zone</th>
                <th className="px-4 py-2">Areas</th>
                <th className="px-4 py-2">~km</th>
                <th className="px-4 py-2">Customer fee</th>
                <th className="px-4 py-2">Rider cost</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className={tbodyCls}>
              {zones.map((z) => (
                <tr key={z.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium">
                    <Link href={`/admin/zones/${z.id}`} className={linkCls}>
                      {z.name}
                    </Link>
                  </td>
                  <td className="max-w-xs px-4 py-2 text-slate-600">{z.areas ?? "—"}</td>
                  <td className="px-4 py-2">{z.approx_distance_km ?? "—"}</td>
                  <td className="px-4 py-2">{formatNaira(z.delivery_fee)}</td>
                  <td className="px-4 py-2">{formatNaira(z.default_rider_cost)}</td>
                  <td className="px-4 py-2">
                    <Badge tone={z.is_active ? "success" : "neutral"}>{z.is_active ? "Active" : "Hidden"}</Badge>
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
