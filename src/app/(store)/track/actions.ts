"use server";
/**
 * Order lookup for /track. Needs BOTH the order number and the phone number
 * used at checkout, and is rate-limited so order numbers can't be guessed.
 * On success, redirects to the private order page (/order/<uuid>).
 */
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FormState } from "@/lib/forms";
import { normalizeNgPhone } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";

const NOT_FOUND = "We couldn't find an order with that order number and phone number. Please check both and try again.";

export async function trackOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await rateLimit("track", 10, 600))) {
    return { error: "Too many attempts. Please wait 10 minutes, or chat with us on WhatsApp." };
  }

  // Accept "ORD-10003", "ord 10003" or just "10003".
  const digits = String(formData.get("orderNumber") ?? "").replace(/\D/g, "");
  const phone = normalizeNgPhone(String(formData.get("phone") ?? ""));
  if (!digits || !phone) return { error: "Enter your order number and the phone number you used at checkout." };

  const { data: order } = await createAdminClient()
    .from("orders")
    .select("id")
    .eq("order_number", `ORD-${digits}`)
    .eq("customer_phone", phone)
    .maybeSingle();

  if (!order) return { error: NOT_FOUND };
  redirect(`/order/${order.id}`);
}
