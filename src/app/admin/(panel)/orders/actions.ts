"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminDb } from "@/lib/auth";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";
import { canTransition } from "@/lib/order-flow";

type Result = { ok: true; message?: string } | { ok: false; error: string };

const statusEnum = z.enum(Object.keys(ORDER_STATUSES) as [OrderStatus, ...OrderStatus[]]);

function refresh(orderId: string) {
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

/**
 * Move an order to a new status. Rules (order-flow.ts) are checked here
 * on the server; the DB trigger logs the change, and we attach the note.
 */
export async function updateOrderStatus(orderId: string, to: OrderStatus, note?: string): Promise<Result> {
  const db = await adminDb();
  if (!z.uuid().safeParse(orderId).success || !statusEnum.safeParse(to).success) {
    return { ok: false, error: "Invalid request" };
  }

  const { data: order } = await db
    .from("orders")
    .select("status, rider_id, payment_status, order_items(vendor_id)")
    .eq("id", orderId)
    .single();
  if (!order) return { ok: false, error: "Order not found" };

  if (!canTransition(order.status, to)) {
    return { ok: false, error: `Can't go from “${ORDER_STATUSES[order.status]}” to “${ORDER_STATUSES[to]}”.` };
  }
  // Guard rails so the data stays meaningful:
  if (to === "vendor_confirmed" && order.order_items.some((i) => !i.vendor_id)) {
    return { ok: false, error: "Assign a vendor to every item (and save) before confirming." };
  }
  if (to === "rider_assigned" && !order.rider_id) {
    return { ok: false, error: "Choose a rider (and save) before marking rider assigned." };
  }
  if (to === "completed" && order.payment_status !== "paid") {
    return { ok: false, error: "Mark the order as paid before completing it." };
  }

  // `.eq("status", order.status)` = only update if nobody changed it meanwhile.
  const { data: updated, error } = await db
    .from("orders")
    .update({ status: to })
    .eq("id", orderId)
    .eq("status", order.status)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!updated?.length) return { ok: false, error: "The order changed in the meantime — refresh the page." };

  const trimmed = note?.trim();
  if (trimmed) {
    // Attach the note to the history row the trigger just wrote.
    const { data: latest } = await db
      .from("order_status_history")
      .select("id")
      .eq("order_id", orderId)
      .eq("to_status", to)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (latest) await db.from("order_status_history").update({ note: trimmed.slice(0, 500) }).eq("id", latest.id);
  }

  refresh(orderId);
  return { ok: true, message: `Moved to “${ORDER_STATUSES[to]}”.` };
}

// ---------- Fulfilment: vendors, costs, rider, fees, notes -----------------

const fulfilmentSchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      vendorId: z.uuid().nullable(),
      unitCost: z.number().int().min(0),
    }),
  ),
  riderId: z.uuid().nullable(),
  riderCost: z.number().int().min(0),
  deliveryFee: z.number().int().min(0),
  adminNotes: z.string().max(2000),
});
export type FulfilmentInput = z.infer<typeof fulfilmentSchema>;

export async function saveFulfilment(orderId: string, input: FulfilmentInput): Promise<Result> {
  const db = await adminDb();
  const parsed = fulfilmentSchema.safeParse(input);
  if (!z.uuid().safeParse(orderId).success || !parsed.success) {
    return { ok: false, error: parsed.error?.issues[0]?.message ?? "Invalid request" };
  }
  const d = parsed.data;

  // Only touch items that belong to THIS order.
  const { data: own } = await db.from("order_items").select("id").eq("order_id", orderId);
  const ownIds = new Set((own ?? []).map((i) => i.id));
  if (d.items.some((i) => !ownIds.has(i.id))) return { ok: false, error: "Item does not belong to this order" };

  const results = await Promise.all([
    ...d.items.map((i) =>
      db.from("order_items").update({ vendor_id: i.vendorId, unit_cost: i.unitCost }).eq("id", i.id),
    ),
    db
      .from("orders")
      .update({
        rider_id: d.riderId,
        rider_cost: d.riderCost,
        delivery_fee: d.deliveryFee,
        admin_notes: d.adminNotes.trim() || null,
      })
      .eq("id", orderId),
  ]);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { ok: false, error: failed.error.message };

  refresh(orderId);
  return { ok: true, message: "Saved." };
}

// ---------- Payment status -------------------------------------------------

/** Pay on delivery: the rider collected the money. */
export async function markOrderPaid(orderId: string): Promise<Result> {
  const db = await adminDb();
  const { data: order } = await db
    .from("orders")
    .select("payment_method, payment_status, total")
    .eq("id", orderId)
    .single();
  if (!order) return { ok: false, error: "Order not found" };
  if (order.payment_method !== "pay_on_delivery") return { ok: false, error: "Paystack orders are marked paid automatically." };
  if (order.payment_status === "paid") return { ok: true };

  const { error } = await db
    .from("orders")
    .update({ payment_status: "paid", amount_paid: order.total!, paid_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) return { ok: false, error: error.message };
  refresh(orderId);
  return { ok: true, message: "Marked as paid." };
}

/** After refunding the customer (e.g. in the Paystack dashboard). */
export async function markOrderRefunded(orderId: string): Promise<Result> {
  const db = await adminDb();
  const { data: order } = await db.from("orders").select("payment_status, status").eq("id", orderId).single();
  if (!order) return { ok: false, error: "Order not found" };
  if (order.payment_status !== "paid") return { ok: false, error: "Only paid orders can be refunded." };
  if (order.status !== "cancelled" && order.status !== "returned") {
    return { ok: false, error: "Cancel or mark the order returned before recording a refund." };
  }
  const { error } = await db.from("orders").update({ payment_status: "refunded" }).eq("id", orderId);
  if (error) return { ok: false, error: error.message };
  refresh(orderId);
  return { ok: true, message: "Marked as refunded." };
}
