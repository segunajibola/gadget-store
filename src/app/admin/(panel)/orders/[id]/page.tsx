import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Phone } from "lucide-react";
import { z } from "zod";
import { adminDb } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatLagosDateTime } from "@/lib/dates";
import { formatNaira } from "@/lib/money";
import { MAIN_FLOW } from "@/lib/order-flow";
import { formatNgPhone, waLink } from "@/lib/phone";
import { customerMessage } from "@/lib/whatsapp-messages";
import { ActionButton } from "@/components/admin/ActionButton";
import { PageHeader } from "@/components/admin/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge, OrderStatusBadge, PAYMENT_STATUS_TONE } from "@/components/ui/Badge";
import { cardCls, linkCls } from "@/components/ui/styles";
import { WhatsAppIcon } from "@/components/store/WhatsApp";
import { markOrderPaid, markOrderRefunded } from "../actions";
import { FulfilmentEditor } from "./FulfilmentEditor";

export const metadata: Metadata = { title: "Order" };

const PAYMENT_LABEL = { pending: "Unpaid", paid: "Paid", failed: "Payment failed", refunded: "Refunded" } as const;

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const db = await adminDb();

  const [orderRes, vendorsRes, ridersRes, settingsRes] = await Promise.all([
    db
      .from("orders")
      .select(
        "*, order_items(id, product_id, product_name, unit_price, unit_cost, quantity, vendor_id, created_at), order_status_history(id, from_status, to_status, note, created_at), riders(name, phone)",
      )
      .eq("id", id)
      .order("created_at", { referencedTable: "order_items" })
      .order("created_at", { referencedTable: "order_status_history" })
      .maybeSingle(),
    db.from("vendors").select("id, name, phone, address, is_active").order("name"),
    db.from("riders").select("id, name, phone, is_active").order("name"),
    db.from("settings").select("store_name, hub_address").single(),
  ]);
  const order = orderRes.data;
  if (!order) notFound();
  const settings = settingsRes.data!;

  // Show inactive vendors/riders only if this order already uses them.
  const usedVendorIds = new Set(order.order_items.map((i) => i.vendor_id));
  const vendors = (vendorsRes.data ?? []).filter((v) => v.is_active || usedVendorIds.has(v.id));
  const riders = (ridersRes.data ?? []).filter((r) => r.is_active || r.id === order.rider_id);

  const isPod = order.payment_method === "pay_on_delivery";
  const paid = order.payment_status === "paid";
  const flowIndex = MAIN_FLOW.indexOf(order.status);
  const offFlow = flowIndex === -1; // cancelled / returned

  const customerWa = waLink(
    order.customer_phone,
    customerMessage({
      storeName: settings.store_name,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      status: order.status,
      riderName: order.riders?.name,
      riderPhone: order.riders?.phone,
    }),
  );

  return (
    <>
      <PageHeader title={order.order_number} back={{ href: "/admin/orders", label: "Orders" }}>
        <OrderStatusBadge status={order.status} />
        <Badge tone={PAYMENT_STATUS_TONE[order.payment_status]}>{PAYMENT_LABEL[order.payment_status]}</Badge>
      </PageHeader>
      <p className="-mt-4 mb-6 text-sm text-slate-500">
        Placed {formatLagosDateTime(order.created_at)} · {isPod ? "Pay on delivery" : "Paystack"}
      </p>

      {/* ---- Progress stepper ---- */}
      <ol className="mb-6 flex flex-wrap gap-x-1 gap-y-2 text-xs" aria-label="Order progress">
        {MAIN_FLOW.map((s, i) => {
          const done = !offFlow && i <= flowIndex;
          return (
            <li key={s} className="flex items-center gap-1">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ${
                  done ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"
                }`}
                aria-current={i === flowIndex ? "step" : undefined}
              >
                {done && <Check className="h-3 w-3" aria-hidden="true" />}
                {ORDER_STATUSES[s]}
              </span>
              {i < MAIN_FLOW.length - 1 && <span className="text-slate-300" aria-hidden="true">—</span>}
            </li>
          );
        })}
        {offFlow && (
          <li>
            <Badge tone="danger">{ORDER_STATUSES[order.status]}</Badge>
          </li>
        )}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <FulfilmentEditor
              status={order.status}
              orderId={order.id}
              orderNumber={order.order_number}
              storeName={settings.store_name}
              hubAddress={settings.hub_address}
              subtotal={order.subtotal}
              paymentFee={order.payment_fee}
              collectOnDelivery={isPod && !paid}
              customer={{
                name: order.customer_name,
                phone: order.customer_phone,
                address: order.delivery_address,
                zone: order.zone_name,
                notes: order.delivery_notes,
              }}
              items={order.order_items.map((i) => ({
                id: i.id,
                productId: i.product_id,
                name: i.product_name,
                qty: i.quantity,
                unitPrice: i.unit_price,
                unitCost: i.unit_cost,
                vendorId: i.vendor_id,
              }))}
              vendors={vendors}
              riders={riders}
              initial={{
                riderId: order.rider_id,
                riderCost: order.rider_cost,
                deliveryFee: order.delivery_fee,
                adminNotes: order.admin_notes ?? "",
              }}
            />
        </div>

        <div className="space-y-6">
          {/* ---- Customer ---- */}
          <section className={cardCls}>
            <h2 className="mb-3 font-semibold">Customer</h2>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-slate-900">{order.customer_name}</p>
              <p>
                <a href={`tel:+${order.customer_phone}`} className={`${linkCls} inline-flex items-center gap-1`}>
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {formatNgPhone(order.customer_phone)}
                </a>
              </p>
              {order.customer_email && <p>{order.customer_email}</p>}
              <p className="whitespace-pre-line pt-2">{order.delivery_address}</p>
              {order.zone_name && <p className="text-slate-500">Zone: {order.zone_name}</p>}
              {order.delivery_notes && <p className="text-slate-500">Note: {order.delivery_notes}</p>}
            </div>
            <a
              href={customerWa}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-whatsapp-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-whatsapp-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              <WhatsAppIcon className="h-4 w-4" /> Update customer
            </a>
          </section>

          {/* ---- Payment ---- */}
          <section className={cardCls}>
            <h2 className="mb-3 font-semibold">Payment</h2>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between"><dt>Method</dt><dd>{isPod ? "Pay on delivery" : "Paystack"}</dd></div>
              <div className="flex justify-between">
                <dt>Status</dt>
                <dd><Badge tone={PAYMENT_STATUS_TONE[order.payment_status]}>{PAYMENT_LABEL[order.payment_status]}</Badge></dd>
              </div>
              <div className="flex justify-between"><dt>Order total</dt><dd className="font-semibold text-slate-900">{formatNaira(order.total!)}</dd></div>
              <div className="flex justify-between"><dt>Amount paid</dt><dd>{formatNaira(order.amount_paid)}</dd></div>
              {!isPod && <div className="flex justify-between"><dt>Paystack fee</dt><dd>{formatNaira(order.payment_fee)}</dd></div>}
              {order.paid_at && <div className="flex justify-between"><dt>Paid</dt><dd>{formatLagosDateTime(order.paid_at)}</dd></div>}
              {order.paystack_reference && (
                <div className="pt-1 text-xs text-slate-500">Ref: <span className="font-mono">{order.paystack_reference}</span></div>
              )}
            </dl>
            {paid && order.amount_paid < order.total! && (
              <div className="mt-3">
                <Alert tone="warning">
                  Customer paid {formatNaira(order.amount_paid)} but the total is now {formatNaira(order.total!)} — collect{" "}
                  {formatNaira(order.total! - order.amount_paid)} or adjust the delivery fee.
                </Alert>
              </div>
            )}
            <div className="mt-3 space-y-2">
              {isPod && !paid && order.status !== "cancelled" && (
                <ActionButton
                  action={markOrderPaid.bind(null, order.id)}
                  label="Mark as paid (cash/transfer received)"
                  variant="primary"
                  confirmText={`Confirm you received ${formatNaira(order.total!)}?`}
                />
              )}
              {paid && (order.status === "cancelled" || order.status === "returned") && (
                <ActionButton
                  action={markOrderRefunded.bind(null, order.id)}
                  label="Mark refunded"
                  confirmText="Only do this after you've refunded the customer (e.g. in the Paystack dashboard). Continue?"
                />
              )}
            </div>
          </section>

          {/* ---- Timeline ---- */}
          <section className={cardCls}>
            <h2 className="mb-3 font-semibold">Timeline</h2>
            <ol className="space-y-3 border-l-2 border-slate-200 pl-4 text-sm">
              {order.order_status_history.map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[1.4rem] top-1 h-2.5 w-2.5 rounded-full bg-brand-600" aria-hidden="true" />
                  <p className="font-medium text-slate-900">{ORDER_STATUSES[h.to_status]}</p>
                  <p className="text-xs text-slate-500">{formatLagosDateTime(h.created_at)}</p>
                  {h.note && <p className="mt-0.5 text-slate-700">{h.note}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}
