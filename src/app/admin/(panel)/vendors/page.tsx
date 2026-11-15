import type { Metadata } from "next";
import Link from "next/link";
import { adminDb } from "@/lib/auth";
import { formatNgPhone } from "@/lib/phone";
import { EmptyState, PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { linkCls, tableCls, tableWrapCls, tbodyCls, theadCls } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Vendors" };

// A Server Component: it runs on the server, can await data directly,
// and sends only the resulting HTML to the browser.
export default async function VendorsPage() {
  const db = await adminDb();
  const { data: vendors, error } = await db
    .from("vendors")
    .select("id, name, phone, address, is_active, products(count)")
    .order("name");
  if (error) throw error;

  return (
    <>
      <PageHeader title="Vendors" newHref="/admin/vendors/new" newLabel="Add vendor" />
      {vendors.length === 0 ? (
        <EmptyState>No vendors yet.</EmptyState>
      ) : (
        <div className={tableWrapCls}>
          <table className={tableCls}>
            <thead className={theadCls}>
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Address</th>
                <th className="px-4 py-2">Products</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className={tbodyCls}>
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium">
                    <Link href={`/admin/vendors/${v.id}`} className={linkCls}>
                      {v.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{v.phone ? formatNgPhone(v.phone) : "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{v.address ?? "—"}</td>
                  <td className="px-4 py-2">{v.products[0]?.count ?? 0}</td>
                  <td className="px-4 py-2">
                    <Badge tone={v.is_active ? "success" : "neutral"}>{v.is_active ? "Active" : "Inactive"}</Badge>
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
