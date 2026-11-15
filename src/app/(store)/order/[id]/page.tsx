/**
 * Order confirmation page: /order/<uuid>
 *
 * The URL contains the order's random UUID (not the guessable ORD-10001),
 * so only the customer who placed it has the link. We select ONLY
 * customer-safe columns — never costs, vendors or rider details.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { z } from "zod";
import { formatNaira } from "@/lib/money";
import { formatNgPhone, waLink } from "@/lib/phone";
import { confirmPaystackPayment } from "@/lib/orders";
import { getSettings } from "@/lib/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { Alert } from "@/components/ui/Alert";
import { Badge, OrderStatusBadge, PAYMENT_STATUS_TONE } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/store/WhatsApp";
import { CancelOrderButton } from "./CancelOrderButton";
import { ClearCartWhenDone } from "./ClearCartWhenDone";
import { PayNowButton } from "./PayNowButton";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };
export const dynamic = "force-dynamic"; // payment status changes — never cache

const PAYMENT_LABEL = { pending: "Awaiting payment", paid: "Paid", failed: "Payment failed", refunded: "Refunded" } as const;

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const [{ id }, { payment }] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();

  const db = createAdminClient();
  const [{ data: order }, settings] = await Promise.all([
    db
      .from("orders")
      .select(
        // paystack_reference is used below for re-checking only; it isn't displayed.
        "id, order_number, created_at, customer_name, customer_phone, delivery_address, zone_name, subtotal, delivery_fee, total, payment_method, payment_status, paystack_reference, status, order_items(product_name, product_slug, unit_price, quantity, line_total)",
      )
      .eq("id", id)
      .maybeSingle(),
    getSettings(),
  ]);
  if (!order) notFound();

  const isPaystack = order.payment_method === "paystack";

  // Self-healing: if an online order still looks unpaid, ask Paystack again.
  // Covers a callback that failed (network blip) or a webhook that hasn't arrived.
  let verifyFailed = false;
  if (isPaystack && order.payment_status !== "paid" && order.paystack_reference) {
    try {
      await confirmPaystackPayment(order.paystack_reference);
      // Re-read: the check may have marked it paid OR failed.
      const { data: fresh } = await db.from("orders").select("payment_status").eq("id", order.id).single();
      if (fresh) order.payment_status = fresh.payment_status;
    } catch (e) {
      verifyFailed = true;
      console.error("[order page] re-verify", e);
    }
  }

  const paid = order.payment_status === "paid";
  // Don't offer "Pay now" if we couldn't check — the customer may already have paid.
  const awaitingOnlinePayment = isPaystack && !paid && order.status !== "cancelled" && !verifyFailed;

  const chat = waLink(
    settings.whatsappNumber,
    `Hi ${settings.storeName}, I'm checking on my order ${order.order_number}.`,
  );

  // Header message depends on order + payment state.
  const hero = order.status === "cancelled" && !paid
    ? {
        icon: <XCircle className="h-12 w-12 text-danger" aria-hidden="true" />,
        title: "Order cancelled",
        text: "This order has been cancelled and you won't be charged. Your cart items are still saved if you'd like to order again.",
      }
    : paid || !isPaystack
    ? {
        icon: <CheckCircle2 className="h-12 w-12 text-success" aria-hidden="true" />,
        title: "Thank you — your order is in!",
        text: isPaystack
          ? "Payment received. We'll confirm your item with the vendor and call you to arrange delivery."
          : "We'll call you shortly to confirm your order and delivery. You'll pay when it arrives.",
      }
    : order.payment_status === "failed" || payment === "failed" || payment === "cancelled"
      ? {
          icon: <XCircle className="h-12 w-12 text-danger" aria-hidden="true" />,
          title: "Payment not completed",
          text: "Your order is saved, but we didn't receive payment. You can try again below.",
        }
      : {
          icon: <Clock className="h-12 w-12 text-warning" aria-hidden="true" />,
          title: "Awaiting payment",
          text: "Your order is saved. Complete payment to confirm it.",
        };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Order is final → empty the browser cart */}
      {(paid || !isPaystack) && <ClearCartWhenDone orderId={order.id} />}
      <div className="flex flex-col items-center text-center">
        {hero.icon}
        <h1 className="mt-4 text-2xl font-bold md:text-3xl">{hero.title}</h1>
        <p className="mt-2 max-w-lg text-slate-700">{hero.text}</p>
        <p className="mt-4 rounded-md bg-slate-50 px-4 py-2 text-sm">
          Order number: <strong className="font-mono text-slate-900">{order.order_number}</strong>
          <span className="block text-xs text-slate-500">Keep this to track your order.</span>
        </p>
      </div>

      {verifyFailed && (
        <div className="mt-6">
          <Alert tone="warning">
            We couldn&apos;t confirm your payment just now. If you were charged, please don&apos;t pay again —
            refresh this page in a minute, or chat with us on WhatsApp.
          </Alert>
        </div>
      )}

      {payment === "error" && (
        <div className="mt-6">
          <Alert tone="warning">We couldn&apos;t open Paystack just now. Please try again.</Alert>
        </div>
      )}

      {awaitingOnlinePayment && (
        <div className="mt-6 flex flex-wrap items-start justify-center gap-3">
          <PayNowButton orderId={order.id} label={`Pay ${formatNaira(order.total!)} now`} />
          {order.status === "new" && <CancelOrderButton orderId={order.id} orderNumber={order.order_number} />}
        </div>
      )}

      {order.status === "cancelled" && !paid && (
        <div className="mt-6 flex justify-center">
          <ButtonLink href="/cart">Back to cart</ButtonLink>
        </div>
      )}

      <div className="mt-10 space-y-6">
        <section className="rounded-lg border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
            <h2 className="font-semibold">Order details</h2>
            <div className="flex gap-2">
              <OrderStatusBadge status={order.status} />
              <Badge tone={PAYMENT_STATUS_TONE[order.payment_status]}>{PAYMENT_LABEL[order.payment_status]}</Badge>
            </div>
          </div>
          <ul className="divide-y divide-slate-100">
            {order.order_items.map((i) => (
              <li key={i.product_name + i.unit_price} className="flex justify-between gap-4 px-4 py-3 text-sm">
                <span className="text-slate-900">
                  {i.product_name} <span className="text-slate-500">× {i.quantity}</span>
                </span>
                <span className="font-medium text-slate-900">{formatNaira(i.line_total!)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-1 border-t border-slate-200 px-4 py-3 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatNaira(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Delivery{order.zone_name ? ` (${order.zone_name})` : ""}</dt>
              <dd>{formatNaira(order.delivery_fee)}</dd>
            </div>
            <div className="flex justify-between pt-1 text-base">
              <dt className="font-semibold text-slate-900">Total</dt>
              <dd className="font-bold text-slate-900">{formatNaira(order.total!)}</dd>
            </div>
          </dl>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4 text-sm">
            <h2 className="mb-2 font-semibold">Delivering to</h2>
            <p className="text-slate-900">{order.customer_name}</p>
            <p>{formatNgPhone(order.customer_phone)}</p>
            <p className="mt-1 whitespace-pre-line">{order.delivery_address}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 text-sm">
            <h2 className="mb-2 font-semibold">What happens next</h2>
            <ol className="list-inside list-decimal space-y-1">
              <li>We confirm your item with a vetted vendor.</li>
              <li>We call you to confirm delivery.</li>
              <li>A rider picks up from Computer Village and delivers to you.</li>
            </ol>
          </div>
        </section>

        <div className="flex flex-wrap justify-center gap-3">
          <a
            href={chat}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-whatsapp-700 px-4 py-2 text-sm font-medium text-white hover:bg-whatsapp-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <WhatsAppIcon className="h-4 w-4" /> Questions? Chat with us
          </a>
          <ButtonLink href="/products" variant="secondary">
            Continue shopping
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
