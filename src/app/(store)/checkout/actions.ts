"use server";
/**
 * Checkout Server Actions. These are PUBLIC endpoints (customers aren't
 * logged in), so they treat every input as untrusted:
 *  - only product ids + quantities come from the browser
 *  - prices, costs, delivery fee and totals are all looked up here
 */
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_QTY } from "@/lib/cart.shared";
import { formatNaira } from "@/lib/money";
import { normalizeNgPhone } from "@/lib/phone";
import { cancelUnpaidOrder, startPaystackPayment } from "@/lib/orders";

const checkoutSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(100),
    phone: z.string().transform((v, ctx) => {
      const p = normalizeNgPhone(v);
      if (!p) {
        ctx.addIssue({ code: "custom", message: "Enter a valid Nigerian phone number" });
        return z.NEVER;
      }
      return p;
    }),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .optional()
      .transform((v) => v || null)
      .pipe(z.email("Enter a valid email address").nullable()),
    address: z.string().trim().min(10, "Enter your full delivery address").max(500),
    notes: z.string().trim().max(500).optional(),
    zoneId: z.uuid("Choose your delivery area"),
    paymentMethod: z.enum(["paystack", "pay_on_delivery"]),
    items: z
      .array(
        z.object({
          productId: z.uuid(),
          qty: z.number().int().min(1).max(MAX_QTY),
        }),
      )
      .min(1, "Your cart is empty")
      .max(30),
  })
  .refine((d) => d.paymentMethod !== "paystack" || d.email, {
    message: "Email is required to pay online (Paystack sends your receipt there)",
    path: ["email"],
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutResult =
  | { ok: true; orderId: string; orderNumber: string; redirectUrl: string }
  | { ok: false; error: string };

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  const db = createAdminClient();

  // Merge duplicate lines (same product twice).
  const qtyById = new Map<string, number>();
  for (const i of d.items) qtyById.set(i.productId, Math.min(MAX_QTY, (qtyById.get(i.productId) ?? 0) + i.qty));

  // Look up everything we need from the DATABASE, not the browser.
  const [productsRes, zoneRes, settingsRes] = await Promise.all([
    db
      .from("products")
      .select("id, name, slug, selling_price, cost_price, vendor_id, stock_status, is_active")
      .in("id", [...qtyById.keys()]),
    db.from("zones").select("id, name, delivery_fee, default_rider_cost, is_active").eq("id", d.zoneId).maybeSingle(),
    db.from("settings").select("pod_max_order_value").single(),
  ]);
  if (productsRes.error || settingsRes.error) {
    console.error("[checkout]", productsRes.error ?? settingsRes.error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  const zone = zoneRes.data;
  if (!zone || !zone.is_active) return { ok: false, error: "Please choose a valid delivery area." };

  const products = productsRes.data;
  for (const id of qtyById.keys()) {
    const p = products.find((x) => x.id === id);
    if (!p || !p.is_active) return { ok: false, error: "An item in your cart is no longer available. Please review your cart." };
    if (p.stock_status !== "available") return { ok: false, error: `“${p.name}” is out of stock. Please remove it from your cart.` };
  }

  const items = products.map((p) => ({
    product_id: p.id,
    product_name: p.name,
    product_slug: p.slug,
    unit_price: p.selling_price,
    unit_cost: p.cost_price, // snapshot; admin can adjust after sourcing
    quantity: qtyById.get(p.id)!,
    vendor_id: p.vendor_id ?? "",
  }));
  const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const total = subtotal + zone.delivery_fee;

  if (d.paymentMethod === "pay_on_delivery" && total > settingsRes.data.pod_max_order_value) {
    return {
      ok: false,
      error: `Pay on delivery is available for orders up to ${formatNaira(settingsRes.data.pod_max_order_value)}. Please pay online.`,
    };
  }

  // Order + items in one transaction (see migration create_order_fn.sql).
  const { data: created, error } = await db.rpc("create_order", {
    p_order: {
      customer_name: d.name,
      customer_phone: d.phone,
      customer_email: d.email ?? "",
      delivery_address: d.address,
      delivery_notes: d.notes ?? "",
      zone_id: zone.id,
      zone_name: zone.name,
      subtotal,
      delivery_fee: zone.delivery_fee,
      rider_cost: zone.default_rider_cost,
      payment_method: d.paymentMethod,
    },
    p_items: items,
  });
  if (error || !created) {
    console.error("[checkout] create_order", error);
    return { ok: false, error: "We couldn't place your order. Please try again." };
  }
  const { id: orderId, order_number: orderNumber } = created as { id: string; order_number: string };

  if (d.paymentMethod === "pay_on_delivery") {
    return { ok: true, orderId, orderNumber, redirectUrl: `/order/${orderId}` };
  }

  try {
    const url = await startPaystackPayment(orderId);
    return { ok: true, orderId, orderNumber, redirectUrl: url };
  } catch (e) {
    console.error("[checkout] paystack init", e);
    // The order exists; the confirmation page offers "Pay now" to retry.
    return { ok: true, orderId, orderNumber, redirectUrl: `/order/${orderId}?payment=error` };
  }
}

/** "Pay now" button on the order page for unpaid Paystack orders. */
export async function retryPayment(orderId: string): Promise<{ url?: string; error?: string }> {
  if (!z.uuid().safeParse(orderId).success) return { error: "Invalid order" };
  try {
    return { url: await startPaystackPayment(orderId) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not start payment" };
  }
}

/** Customer cancels an unpaid online order (checkout panel / order page). */
export async function cancelOrder(orderId: string): Promise<{ ok: boolean; error?: string; paid?: boolean }> {
  if (!z.uuid().safeParse(orderId).success) return { ok: false, error: "Invalid order" };
  try {
    return await cancelUnpaidOrder(orderId);
  } catch (e) {
    console.error("[cancelOrder]", e);
    return { ok: false, error: "Could not cancel the order. Please try again." };
  }
}
