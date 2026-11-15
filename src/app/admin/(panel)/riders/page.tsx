import type { Metadata } from "next";
import Link from "next/link";
import { adminDb } from "@/lib/auth";
import { formatNgPhone } from "@/lib/phone";
import { Badge, EmptyState, PageHeader } from "@/components/admin/PageHeader";

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
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Notes</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {riders.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">
                    <Link href={`/admin/riders/${r.id}`} className="text-blue-700 hover:underline">
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{formatNgPhone(r.phone)}</td>
                  <td className="px-4 py-2 text-gray-600">{r.notes ?? "—"}</td>
                  <td className="px-4 py-2">
                    <Badge on={r.is_active}>{r.is_active ? "Active" : "Inactive"}</Badge>
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
