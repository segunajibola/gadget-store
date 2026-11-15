import type { Metadata } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { getSettings } from "@/lib/store";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

// Always fresh: zones/fees and the pay-on-delivery limit must be current.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const db = createPublicClient();
  const [{ data: zones }, settings] = await Promise.all([
    db
      .from("zones")
      .select("id, name, areas, delivery_fee")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    getSettings(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">Checkout</h1>
      <CheckoutForm zones={zones ?? []} podMaxOrderValue={settings.podMaxOrderValue} />
    </div>
  );
}
