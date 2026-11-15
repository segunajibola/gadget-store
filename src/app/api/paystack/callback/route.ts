/**
 * GET /api/paystack/callback?reference=…
 *
 * Paystack sends the customer's browser here after the payment page.
 * The query string is NOT proof of payment — we verify with Paystack's API
 * (confirmPaystackPayment) and then redirect to the order page.
 */
import { NextResponse, type NextRequest } from "next/server";
import { confirmPaystackPayment } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const reference = params.get("reference") ?? params.get("trxref");
  const home = new URL("/", request.url);
  if (!reference) return NextResponse.redirect(home);

  try {
    const { orderId, paid } = await confirmPaystackPayment(reference);
    if (!orderId) return NextResponse.redirect(home);
    const dest = new URL(`/order/${orderId}`, request.url);
    if (!paid) dest.searchParams.set("payment", "failed");
    return NextResponse.redirect(dest);
  } catch (e) {
    // Couldn't reach Paystack to verify (network issue). Still send the
    // customer to their order page — it re-checks the payment on load.
    console.error("[paystack callback]", e);
    const { data } = await createAdminClient()
      .from("orders")
      .select("id")
      .eq("paystack_reference", reference)
      .maybeSingle();
    return NextResponse.redirect(data ? new URL(`/order/${data.id}?payment=checking`, request.url) : home);
  }
}
