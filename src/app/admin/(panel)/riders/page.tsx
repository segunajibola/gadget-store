import type { Metadata } from "next";
import Link from "next/link";
import { adminDb } from "@/lib/auth";
import { formatNgPhone } from "@/lib/phone";
import { EmptyState, PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { linkCls, tableCls, tableWrapCls, tbodyCls, theadCls } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Riders" };

export default async function RidersPage() {
  const db = await adminDb();
  const { data: riders, error } = await db
    .from("riders")
    .select("id, name, phone, notes, is_active")
    .order("name");
  if (error) throw error;

  return (
    <>
      <PageHeader title="Riders" newHref="/admin/riders/new" newLabel="Add rider" />
      {riders.length === 0 ? (
        <EmptyState>No riders yet.</EmptyState>
      ) : (
        <div className={tableWrapCls}>
          <table className={tableCls}>
            <thead className={theadCls}>
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Notes</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className={tbodyCls}>
              {riders.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium">
                    <Link href={`/admin/riders/${r.id}`} className={linkCls}>
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{formatNgPhone(r.phone)}</td>
                  <td className="px-4 py-2 text-slate-600">{r.notes ?? "—"}</td>
                  <td className="px-4 py-2">
                    <Badge tone={r.is_active ? "success" : "neutral"}>{r.is_active ? "Active" : "Inactive"}</Badge>
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
