import type { Metadata } from "next";
import Link from "next/link";
import { adminDb } from "@/lib/auth";
import { formatNgPhone } from "@/lib/phone";
import { Badge, EmptyState, PageHeader } from "@/components/admin/PageHeader";

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
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Address</th>
                <th className="px-4 py-2">Products</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">
                    <Link href={`/admin/vendors/${v.id}`} className="text-blue-700 hover:underline">
                      {v.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{v.phone ? formatNgPhone(v.phone) : "—"}</td>
                  <td className="px-4 py-2 text-gray-600">{v.address ?? "—"}</td>
                  <td className="px-4 py-2">{v.products[0]?.count ?? 0}</td>
                  <td className="px-4 py-2">
                    <Badge on={v.is_active}>{v.is_active ? "Active" : "Inactive"}</Badge>
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
