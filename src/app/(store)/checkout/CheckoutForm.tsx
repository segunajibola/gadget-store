"use client";

/**
 * Checkout form. Shows live totals for the customer, but the server action
 * (placeOrder) recalculates everything — what's shown here is a preview.
 */
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CreditCard, Lock, Truck } from "lucide-react";
import { cartActions, pendingOrderActions, useCart, useHydrated, usePendingOrder } from "@/lib/cart";
import { formatNaira } from "@/lib/money";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { inputCls } from "@/components/ui/styles";
import { placeOrder } from "./actions";
import { UnpaidOrderPanel } from "./UnpaidOrderPanel";

type Zone = { id: string; name: string; areas: string | null; delivery_fee: number };
type PaymentMethod = "paystack" | "pay_on_delivery";

export function CheckoutForm({ zones, podMaxOrderValue }: { zones: Zone[]; podMaxOrderValue: number }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const { items, subtotal } = useCart();
  const pendingOrder = usePendingOrder();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const [zoneId, setZoneId] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("paystack");

  const zone = zones.find((z) => z.id === zoneId);
  const deliveryFee = zone?.delivery_fee ?? 0;
  const total = subtotal + deliveryFee;
  const podAllowed = total <= podMaxOrderValue;
  // If the total grows past the limit, fall back to Paystack automatically.
  const paymentMethod: PaymentMethod = podAllowed ? method : "paystack";

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  if (!hydrated) return <p className="py-12 text-center text-slate-500">Loading…</p>;
  if (redirecting) return <p className="py-12 text-center text-slate-500">Order placed — redirecting…</p>;

  // Came back from Paystack without paying (pressed Cancel / Back)?
  // Offer to finish that order instead of creating a duplicate.
  if (pendingOrder) return <UnpaidOrderPanel order={pendingOrder} />;

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-16 text-center">
        <p className="font-medium text-slate-900">Your cart is empty</p>
        <ButtonLink href="/products" className="mt-6">
          Browse products
        </ButtonLink>
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await placeOrder({
        ...form,
        zoneId,
        paymentMethod,
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRedirecting(true);
      if (paymentMethod === "pay_on_delivery") {
        // Order is final — empty the cart now.
        cartActions.clear();
        pendingOrderActions.clear();
      } else {
        // Keep the cart until payment is confirmed (the order page clears it).
        pendingOrderActions.set({ id: result.orderId, orderNumber: result.orderNumber });
      }
      // Paystack's page is on another site, so do a full navigation there.
      if (result.redirectUrl.startsWith("http")) window.location.assign(result.redirectUrl);
      else router.push(result.redirectUrl);
    });
  }

  const radioCard = (active: boolean, disabled = false) =>
    `flex cursor-pointer gap-3 rounded-lg border p-4 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500 ${
      disabled
        ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
        : active
          ? "border-brand-600 bg-brand-50"
          : "border-slate-200 hover:border-brand-300"
    }`;

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {!podAllowed && (
        <div className="lg:col-span-2">
          <Alert tone="info">
            Your order total of <strong>{formatNaira(total)}</strong> is above our pay-on-delivery limit of{" "}
            <strong>{formatNaira(podMaxOrderValue)}</strong>, so this order needs to be paid online with
            Paystack (card, bank transfer or USSD).
          </Alert>
        </div>
      )}
      <div className="space-y-8">
        {/* ---- Contact ---- */}
        <section className="space-y-4" aria-labelledby="contact-h">
          <h2 id="contact-h" className="text-lg font-semibold">
            Your details
          </h2>
          <Field label="Full name">
            <input required autoComplete="name" value={form.name} onChange={set("name")} className={inputCls} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone (WhatsApp preferred)" hint="We'll call to confirm your order">
              <input
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0801 234 5678"
                value={form.phone}
                onChange={set("phone")}
                className={inputCls}
              />
            </Field>
            <Field
              label={paymentMethod === "paystack" ? "Email" : "Email (optional)"}
              hint={paymentMethod === "paystack" ? "Your payment receipt is sent here" : undefined}
            >
              <input
                type="email"
                autoComplete="email"
                required={paymentMethod === "paystack"}
                value={form.email}
                onChange={set("email")}
                className={inputCls}
              />
            </Field>
          </div>
        </section>

        {/* ---- Delivery ---- */}
        <section className="space-y-4" aria-labelledby="delivery-h">
          <h2 id="delivery-h" className="text-lg font-semibold">
            Delivery
          </h2>
          <Field label="Delivery area" hint="Pick the closest area — we'll confirm the exact fee when we call.">
            <select required value={zoneId} onChange={(e) => setZoneId(e.target.value)} className={inputCls}>
              <option value="" disabled>
                Choose your area…
              </option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} — {formatNaira(z.delivery_fee)}
                </option>
              ))}
            </select>
          </Field>
          {zone?.areas && <p className="-mt-2 text-xs text-slate-500">Covers: {zone.areas}</p>}
          <Field label="Full delivery address">
            <textarea
              required
              rows={3}
              autoComplete="street-address"
              placeholder="House number, street, area, nearest bus stop or landmark"
              value={form.address}
              onChange={set("address")}
              className={inputCls}
            />
          </Field>
          <Field label="Delivery notes (optional)">
            <input
              placeholder="e.g. Call when you're at the gate"
              value={form.notes}
              onChange={set("notes")}
              className={inputCls}
            />
          </Field>
        </section>

        {/* ---- Payment ---- */}
        <fieldset className="space-y-3">
          <legend className="mb-3 text-lg font-semibold text-slate-900">Payment</legend>
          <label className={radioCard(paymentMethod === "paystack")}>
            <input
              type="radio"
              name="payment"
              className="mt-1 accent-brand-600"
              checked={paymentMethod === "paystack"}
              onChange={() => setMethod("paystack")}
            />
            <span>
              <span className="flex items-center gap-2 font-medium text-slate-900">
                <CreditCard className="h-4 w-4 text-brand-600" aria-hidden="true" /> Pay now with Paystack
              </span>
              <span className="text-sm text-slate-500">Card, bank transfer or USSD. Secure payment.</span>
            </span>
          </label>
          <label className={radioCard(paymentMethod === "pay_on_delivery", !podAllowed)}>
            <input
              type="radio"
              name="payment"
              className="mt-1 accent-brand-600"
              disabled={!podAllowed}
              checked={paymentMethod === "pay_on_delivery"}
              onChange={() => setMethod("pay_on_delivery")}
            />
            <span>
              <span className="flex items-center gap-2 font-medium text-slate-900">
                <Truck className="h-4 w-4 text-brand-600" aria-hidden="true" /> Pay on delivery
              </span>
              <span className="text-sm text-slate-500">
                {podAllowed
                  ? "Pay the rider by transfer or cash when your order arrives."
                  : `Available for orders up to ${formatNaira(podMaxOrderValue)}.`}
              </span>
            </span>
          </label>
        </fieldset>
      </div>

      {/* ---- Summary ---- */}
      <aside className="h-fit space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 lg:sticky lg:top-36">
        <h2 className="font-semibold">Order summary</h2>
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.productId} className="flex gap-3 text-sm">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-white">
                {i.image && <Image src={i.image} alt="" fill sizes="48px" className="object-contain p-0.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-slate-900">{i.name}</p>
                <p className="text-slate-500">Qty {i.qty}</p>
              </div>
              <p className="font-medium text-slate-900">{formatNaira(i.price * i.qty)}</p>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-slate-200 pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="text-slate-900">{formatNaira(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd className="text-slate-900">{zone ? formatNaira(deliveryFee) : "Choose area"}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
            <dt className="font-semibold text-slate-900">Total</dt>
            <dd className="font-bold text-slate-900">{formatNaira(total)}</dd>
          </div>
        </dl>

        {error && <Alert tone="danger">{error}</Alert>}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Placing order…" : paymentMethod === "paystack" ? `Pay ${formatNaira(total)}` : "Place order"}
        </Button>
        <p className="flex items-center justify-center gap-1 text-xs text-slate-500">
          <Lock className="h-3 w-3" aria-hidden="true" /> Prices are confirmed on our server before payment.
        </p>
        <Link href="/cart" className="block text-center text-sm text-brand-600 hover:text-brand-700 hover:underline">
          Edit cart
        </Link>
      </aside>
    </form>
  );
}
