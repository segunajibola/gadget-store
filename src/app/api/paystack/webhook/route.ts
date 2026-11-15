/**
 * POST /api/paystack/webhook
 *
 * Paystack calls this server-to-server when a payment succeeds — even if
 * the customer closed their browser before returning to our site.
 * Set this URL in Paystack Dashboard → Settings → API Keys & Webhooks.
 *
 * Security: we check the HMAC signature (proves it came from Paystack), and
 * confirmPaystackPayment() re-verifies the transaction with Paystack's API.
 */
import { NextResponse } from "next/server";
import { isValidWebhookSignature } from "@/lib/paystack";
import { confirmPaystackPayment } from "@/lib/orders";

export async function POST(request: Request) {
  // Signature is computed over the RAW body, so read text before parsing.
  const raw = await request.text();
  if (!isValidWebhookSignature(raw, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  if (event.event === "charge.success" && event.data?.reference) {
    try {
      await confirmPaystackPayment(event.data.reference);
    } catch (e) {
      // A non-200 response makes Paystack retry later, which is what we want.
      console.error("[paystack webhook]", e);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  // Acknowledge everything else so Paystack doesn't keep retrying.
  return NextResponse.json({ received: true });
}
