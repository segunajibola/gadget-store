"use client";

/**
 * Edit how an order is fulfilled: vendor + actual cost per item, rider,
 * rider cost, delivery fee, notes. Profit and the WhatsApp messages update
 * live from what's typed (before saving).
 */
import Link from "next/link";
import { useState, useTransition } from "react";
import { formatNaira, koboToNaira, nairaToKobo } from "@/lib/money";
import { waLink } from "@/lib/phone";
import { riderMessage, vendorMessage } from "@/lib/whatsapp-messages";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { cardCls, inputCls, linkCls } from "@/components/ui/styles";
import { WhatsAppIcon } from "@/components/store/WhatsApp";
import type { OrderStatus } from "@/lib/constants";
import { saveFulfilment } from "../actions";
import { StatusPanel } from "./StatusPanel";

type Vendor = { id: string; name: string; phone: string | null; address: string | null; is_active: boolean };
type Rider = { id: string; name: string; phone: string; is_active: boolean };
type Item = {
  id: string;
  productId: string | null;
  name: string;
  qty: number;
  unitPrice: number;
  unitCost: number;
  vendorId: string | null;
};

export type FulfilmentProps = {
  orderId: string;
  orderNumber: string;
  storeName: string;
  hubAddress: string;
  subtotal: number;
  paymentFee: number;
  collectOnDelivery: boolean; // pay on delivery and not yet paid
  customer: { name: string; phone: string; address: string; zone: string | null; notes: string | null };
  items: Item[];
  vendors: Vendor[];
  riders: Rider[];
  initial: { riderId: string | null; riderCost: number; deliveryFee: number; adminNotes: string };
  status: OrderStatus;
};

const naira = (kobo: number) => String(koboToNaira(kobo));
const toKobo = (s: string) => nairaToKobo(s) ?? NaN;

function WaButton({ href, children, disabled }: { href: string; children: React.ReactNode; disabled?: boolean }) {
  if (disabled) {
    return (
      <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-sm text-slate-500">
        <WhatsAppIcon className="h-4 w-4" /> {children}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-md bg-whatsapp-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-whatsapp-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      <WhatsAppIcon className="h-4 w-4" /> {children}
    </a>
  );
}

export function FulfilmentEditor(p: FulfilmentProps) {
  const [items, setItems] = useState(p.items.map((i) => ({ ...i, cost: naira(i.unitCost) })));
  const [riderId, setRiderId] = useState(p.initial.riderId ?? "");
  const [riderCost, setRiderCost] = useState(naira(p.initial.riderCost));
  const [deliveryFee, setDeliveryFee] = useState(naira(p.initial.deliveryFee));
  const [notes, setNotes] = useState(p.initial.adminNotes);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const updateItem = (id: string, patch: Partial<(typeof items)[number]>) =>
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  // ---- Live numbers ----
  const vendorCost = items.reduce((s, i) => s + (toKobo(i.cost) || 0) * i.qty, 0);
  const riderCostK = toKobo(riderCost) || 0;
  const deliveryFeeK = toKobo(deliveryFee) || 0;
  const total = p.subtotal + deliveryFeeK;
  const profit = total - vendorCost - riderCostK - p.paymentFee;
  const invalid =
    items.some((i) => Number.isNaN(toKobo(i.cost))) ||
    Number.isNaN(toKobo(riderCost)) ||
    Number.isNaN(toKobo(deliveryFee));

  const vendorById = new Map(p.vendors.map((v) => [v.id, v]));
  const rider = p.riders.find((r) => r.id === riderId) ?? null;

  // Items grouped by vendor → one WhatsApp message per vendor.
  const byVendor = new Map<string, typeof items>();
  for (const i of items) if (i.vendorId) byVendor.set(i.vendorId, [...(byVendor.get(i.vendorId) ?? []), i]);

  const pickups = [...byVendor.entries()].map(([vid, list]) => {
    const v = vendorById.get(vid)!;
    return {
      name: v.name,
      phone: v.phone,
      address: v.address,
      items: list.map((i) => ({ name: i.name, qty: i.qty, unitCost: toKobo(i.cost) || 0 })),
    };
  });

  // ---- Unsaved-changes tracking ----
  const payload = () => ({
    items: items.map((i) => ({ id: i.id, vendorId: i.vendorId, unitCost: toKobo(i.cost) })),
    riderId: riderId || null,
    riderCost: riderCostK,
    deliveryFee: deliveryFeeK,
    adminNotes: notes,
  });
  const snapshot = JSON.stringify(payload());
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot); // what's in the DB
  const dirty = snapshot !== savedSnapshot;

  async function persist(): Promise<string | null> {
    const res = await saveFulfilment(p.orderId, payload());
    if (!res.ok) return res.error;
    setSavedSnapshot(snapshot);
    return null;
  }

  function save() {
    setResult(null);
    startTransition(async () => {
      const error = await persist();
      setResult(error ? { ok: false, text: error } : { ok: true, text: "Saved." });
    });
  }

  /**
   * Runs before every status change: checks what's ON SCREEN (not just the
   * DB), then saves any unsaved edits so the server checks the same data.
   */
  async function prepareStatusChange(to: OrderStatus): Promise<string | null> {
    if (to === "vendor_confirmed" && items.some((i) => !i.vendorId)) {
      return "Choose a vendor for every item before confirming.";
    }
    if (to === "rider_assigned" && !riderId) return "Choose a rider before marking rider assigned.";
    if (invalid) return "Fix the highlighted amounts first.";
    return dirty ? persist() : null;
  }

  return (
    <div className="space-y-6">
      <section className={cardCls}>
        <h2 className="mb-3 font-semibold">Next step</h2>
        <StatusPanel orderId={p.orderId} status={p.status} prepare={prepareStatusChange} />
        {dirty && (
          <p className="mt-2 text-xs text-warning-700">You have unsaved changes below — they&apos;ll be saved when you change the status.</p>
        )}
      </section>

    <div className={`${cardCls} grid gap-6 xl:grid-cols-[1fr_300px]`}>
      <div className="space-y-6">
        {/* ---- Items ---- */}
        <section>
          <h2 className="mb-3 font-semibold">Items &amp; vendors</h2>
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.id} className="rounded-md border border-slate-200 p-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-medium text-slate-900">
                    {i.productId ? (
                      <Link href={`/admin/products/${i.productId}`} className={linkCls}>{i.name}</Link>
                    ) : (
                      i.name
                    )}{" "}
                    <span className="text-slate-500">× {i.qty}</span>
                  </p>
                  <p className="text-sm text-slate-700">Sold at {formatNaira(i.unitPrice)} each</p>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span className="text-slate-500">Vendor for this order <span className="text-xs">(starts as the product&apos;s usual vendor — change anytime)</span></span>
                    <select
                      value={i.vendorId ?? ""}
                      onChange={(e) => updateItem(i.id, { vendorId: e.target.value || null })}
                      className={inputCls}
                    >
                      <option value="">— Choose vendor —</option>
                      {p.vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                          {v.is_active ? "" : " (inactive)"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-slate-500">Actual cost each (₦)</span>
                    <input
                      inputMode="decimal"
                      value={i.cost}
                      onChange={(e) => updateItem(i.id, { cost: e.target.value })}
                      className={`${inputCls} ${Number.isNaN(toKobo(i.cost)) ? "border-danger" : ""}`}
                    />
                  </label>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap gap-2">
            {[...byVendor.entries()].map(([vid, list]) => {
              const v = vendorById.get(vid)!;
              const msg = vendorMessage({
                storeName: p.storeName,
                orderNumber: p.orderNumber,
                vendorName: v.name,
                items: list.map((i) => ({ name: i.name, qty: i.qty, unitCost: toKobo(i.cost) || 0 })),
              });
              return (
                <WaButton key={vid} href={v.phone ? waLink(v.phone, msg) : "#"} disabled={!v.phone}>
                  {v.phone ? `Ask ${v.name}` : `${v.name}: no phone`}
                </WaButton>
              );
            })}
            {byVendor.size === 0 && <p className="text-sm text-slate-500">Choose a vendor to message them.</p>}
          </div>
        </section>

        {/* ---- Delivery ---- */}
        <section className="space-y-3">
          <h2 className="font-semibold">Delivery</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1 text-sm sm:col-span-1">
              <span className="text-slate-500">Rider</span>
              <select value={riderId} onChange={(e) => setRiderId(e.target.value)} className={inputCls}>
                <option value="">— Choose rider —</option>
                {p.riders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                    {r.is_active ? "" : " (inactive)"}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-slate-500">Rider cost (₦)</span>
              <input
                inputMode="decimal"
                value={riderCost}
                onChange={(e) => setRiderCost(e.target.value)}
                className={`${inputCls} ${Number.isNaN(toKobo(riderCost)) ? "border-danger" : ""}`}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-slate-500">Customer delivery fee (₦)</span>
              <input
                inputMode="decimal"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className={`${inputCls} ${Number.isNaN(toKobo(deliveryFee)) ? "border-danger" : ""}`}
              />
            </label>
          </div>
          <WaButton
            disabled={!rider}
            href={
              rider
                ? waLink(
                    rider.phone,
                    riderMessage({
                      storeName: p.storeName,
                      orderNumber: p.orderNumber,
                      riderName: rider.name.split(" ")[0],
                      pickups,
                      hubAddress: p.hubAddress,
                      customer: p.customer,
                      collectAmount: p.collectOnDelivery ? total : null,
                      riderFee: riderCostK,
                    }),
                  )
                : "#"
            }
          >
            {rider ? `Send job to ${rider.name}` : "Choose a rider to message"}
          </WaButton>
        </section>

        <label className="block space-y-1 text-sm">
          <span className="font-semibold text-slate-900">Admin notes (private)</span>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={save} disabled={pending || invalid}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
          {invalid && <span className="text-sm text-danger-700">Fix the highlighted amounts.</span>}
          {dirty && !invalid && <span className="text-sm text-warning-700">Unsaved changes</span>}
        </div>
        {result && <Alert tone={result.ok ? "success" : "danger"}>{result.text}</Alert>}
      </div>

      {/* ---- Live profit ---- */}
      <aside className="h-fit rounded-lg border border-slate-200 bg-slate-50 p-4 xl:sticky xl:top-4">
        <h2 className="mb-3 font-semibold">Profit</h2>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between"><dt>Items sold</dt><dd>{formatNaira(p.subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Delivery fee charged</dt><dd>{formatNaira(deliveryFeeK)}</dd></div>
          <div className="flex justify-between border-b border-slate-200 pb-1.5 font-medium text-slate-900">
            <dt>Order total</dt><dd>{formatNaira(total)}</dd>
          </div>
          <div className="flex justify-between"><dt>− Vendor cost</dt><dd>{formatNaira(vendorCost)}</dd></div>
          <div className="flex justify-between"><dt>− Rider cost</dt><dd>{formatNaira(riderCostK)}</dd></div>
          <div className="flex justify-between"><dt>− Paystack fee</dt><dd>{formatNaira(p.paymentFee)}</dd></div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
            <dt className="font-semibold text-slate-900">Profit</dt>
            <dd className={`font-bold ${profit < 0 ? "text-danger-700" : "text-success-700"}`}>{formatNaira(profit)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-slate-500">Updates as you edit. Save to keep changes.</p>
      </aside>
    </div>
    </div>
  );
}
