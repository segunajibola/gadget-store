"use server";

import { adminDb } from "@/lib/auth";

export type NavCounts = { leads: number; orders: number; reviews: number };

/** Menu badge counts: new laptop leads, and orders waiting for action. */
export async function getNavCounts(): Promise<NavCounts> {
  const db = await adminDb();
  const [leadsRes, ordersRes, reviewsRes] = await Promise.all([
    db.from("laptop_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
    db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "new")
      .or("payment_method.eq.pay_on_delivery,payment_status.eq.paid"),
    db.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  return { leads: leadsRes.count ?? 0, orders: ordersRes.count ?? 0, reviews: reviewsRes.count ?? 0 };
}
