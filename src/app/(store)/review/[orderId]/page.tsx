/**
 * /review/<order uuid> — link sent to customers on WhatsApp after delivery.
 */
import type { Metadata } from "next";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";
import { ReviewForm } from "./ReviewForm";

export const metadata: Metadata = { title: "Review your order", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  let message: string | null = null;
  let order: { order_number: string; customer_name: string; order_items: { product_name: string }[] } | null = null;

  if (!z.uuid().safeParse(orderId).success) message = "This review link isn't valid.";
  else {
    const db = createAdminClient();
    const [{ data }, { count }] = await Promise.all([
      db.from("orders").select("order_number, status, customer_name, order_items(product_name)").eq("id", orderId).maybeSingle(),
      db.from("reviews").select("id", { count: "exact", head: true }).eq("order_id", orderId),
    ]);
    if (!data) message = "This review link isn't valid.";
    else if ((count ?? 0) > 0) message = "Thanks — you've already reviewed this order. We really appreciate it!";
    else if (data.status !== "delivered" && data.status !== "completed")
      message = "You'll be able to leave a review once your order has been delivered.";
    else order = data;
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold md:text-3xl">How did we do?</h1>
      {order ? (
        <>
          <p className="mt-2 text-slate-700">
            Hi {order.customer_name.split(" ")[0]}, thanks for your order{" "}
            <span className="font-mono text-slate-900">{order.order_number}</span> (
            {order.order_items.map((i) => i.product_name).join(", ")}). Your review helps other buyers shop with
            confidence.
          </p>
          <div className="mt-8">
            <ReviewForm orderId={orderId} />
          </div>
        </>
      ) : (
        <div className="mt-6 space-y-4">
          <Alert tone="info">{message}</Alert>
          <ButtonLink href="/" variant="secondary">
            Back to the store
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
