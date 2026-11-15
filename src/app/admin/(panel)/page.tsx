import type { Metadata } from "next";
import Link from "next/link";
import { adminDb } from "@/lib/auth";
import { cardCls } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Dashboard" };

// Placeholder dashboard — orders, revenue and profit stats come in stage 5.
export default async function DashboardPage() {
  const db = await adminDb();

  // `head: true` + `count: "exact"` returns only the row count, no data.
  const count = (table: "products" | "vendors" | "riders" | "zones") =>
    db.from(table).select("*", { count: "exact", head: true }).then((r) => r.count ?? 0);

  const [products, vendors, riders, zones] = await Promise.all([
    count("products"),
    count("vendors"),
    count("riders"),
    count("zones"),
  ]);

  const cards = [
    { label: "Products", value: products, href: "/admin/products" },
    { label: "Vendors", value: vendors, href: "/admin/vendors" },
    { label: "Riders", value: riders, href: "/admin/riders" },
    { label: "Delivery zones", value: zones, href: "/admin/zones" },
  ];

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className={`${cardCls} hover:border-blue-300`}>
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="mt-1 text-3xl font-semibold">{c.value}</p>
          </Link>
        ))}
      </div>
      <p className="mt-6 text-sm text-gray-500">Order and profit stats arrive in stage 5.</p>
    </>
  );
}
