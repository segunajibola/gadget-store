/**
 * Order + payment logic shared by checkout, the Paystack callback and the
 * Paystack webhook. SERVER ONLY — uses the service-role client.
 */
import "server-only";
import { publicEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { initializeTransaction, newReference, verifyTransaction } from "@/lib/paystack";

/**
 * Create a fresh Paystack transaction for an order and return the URL of
 * Paystack's payment page. Used at checkout and for "try again".
 */
export async function startPaystackPayment(orderId: string): Promise<string> {
  const db = createAdminClient();
  const { data: order, error } = await db
    .from("orders")
    .select("id, order_number, customer_email, total, payment_method, payment_status, status")
    .eq("id", orderId)
    .single();
  if (error || !order) throw new Error("Order not found");
  if (order.payment_method !== "paystack") throw new Error("Order is not a Paystack order");
  if (order.payment_status === "paid") throw new Error("Order is already paid");
  if (order.status === "cancelled") throw new Error("Order was cancelled");
  if (!order.customer_email) throw new Error("An email address is required to pay online");

  const reference = newReference(order.order_number);
  const tx = await initializeTransaction({
    email: order.customer_email,
    amount: order.total!,
    reference,
    callbackUrl: `${publicEnv.siteUrl}/api/paystack/callback`,
    metadata: { order_id: order.id, order_number: order.order_number },
  });

  // Remember the latest reference so the callback/webhook can find the order.
  await db.from("orders").update({ paystack_reference: reference }).eq("id", order.id);
  return tx.authorization_url;
}

export type PaymentResult = { orderId: string | null; paid: boolean };

/**
 * Verify a Paystack transaction WITH PAYSTACK (not trusting the caller) and,
 * if it succeeded for the right amount, mark the order paid.
 *
 * Idempotent: safe to call many times for the same reference (the callback
 * and webhook will both call it) — it only ever marks an order paid once.
 */
export async function confirmPaystackPayment(reference: string): Promise<PaymentResult> {
  const db = createAdminClient();
  const tx = await verifyTransaction(reference);

  // Find the order: by reference first, else by the order id we put in metadata
  // (covers a customer paying on an older link after pressing "try again").
  let { data: order } = await db
    .from("orders")
    .select("id, total, payment_status")
    .eq("paystack_reference", reference)
    .maybeSingle();
  if (!order && tx.metadata?.order_id) {
    ({ data: order } = await db
      .from("orders")
      .select("id, total, payment_status")
      .eq("id", String(tx.metadata.order_id))
      .maybeSingle());
  }
  if (!order) {
    console.error("[paystack] no order for reference", reference);
    return { orderId: null, paid: false };
  }
  if (order.payment_status === "paid") return { orderId: order.id, paid: true };

  const ok = tx.status === "success" && tx.currency === "NGN" && tx.amount >= order.total!;

  if (ok) {
    // `.neq("payment_status", "paid")` makes this a no-op if a parallel call
    // (callback vs webhook) already marked it paid.
    const { error } = await db
      .from("orders")
      .update({
        payment_status: "paid",
        paystack_reference: reference,
        amount_paid: tx.amount,
        payment_fee: tx.fees ?? 0,
        paid_at: tx.paid_at ?? new Date().toISOString(),
      })
      .eq("id", order.id)
      .neq("payment_status", "paid");
    if (error) throw error;
    return { orderId: order.id, paid: true };
  }

  if (tx.status === "success") {
    // Paid, but the wrong amount/currency — leave for manual review.
    console.error("[paystack] amount/currency mismatch", { reference, tx, orderTotal: order.total });
  } else if (tx.status === "failed") {
    await db
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("id", order.id)
      .eq("payment_status", "pending");
  }
  return { orderId: order.id, paid: false };
}
