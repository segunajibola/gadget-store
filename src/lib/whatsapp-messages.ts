/**
 * Pre-filled WhatsApp messages for the admin order page. Plain functions —
 * edit the wording here. Used with waLink() from lib/phone.ts.
 * ADMIN ONLY: vendor messages include cost prices.
 */
import type { OrderStatus } from "@/lib/constants";
import { formatNaira } from "@/lib/money";
import { formatNgPhone } from "@/lib/phone";

type Item = { name: string; qty: number; unitCost: number };
type VendorStop = { name: string; phone: string | null; address: string | null; items: Item[] };

export function vendorMessage(o: {
  storeName: string;
  orderNumber: string;
  vendorName: string;
  items: Item[];
}): string {
  const lines = o.items.map((i) => `• ${i.qty} × ${i.name} — ${formatNaira(i.unitCost)} each`);
  return [
    `Hi ${o.vendorName}, this is ${o.storeName}.`,
    `Do you have these available for order ${o.orderNumber}?`,
    ...lines,
    "",
    "Please confirm stock and price. A rider will pick up from you once confirmed. Thank you!",
  ].join("\n");
}

export function riderMessage(o: {
  storeName: string;
  orderNumber: string;
  riderName: string;
  pickups: VendorStop[];
  hubAddress: string;
  customer: { name: string; phone: string; address: string; zone: string | null; notes: string | null };
  collectAmount: number | null; // kobo to collect on delivery, or null if prepaid
  riderFee: number;
}): string {
  const pickupLines = o.pickups.length
    ? o.pickups.flatMap((p) => [
        `📦 ${p.name}${p.phone ? ` (${formatNgPhone(p.phone)})` : ""}`,
        `   ${p.address ?? o.hubAddress}`,
        ...p.items.map((i) => `   - ${i.qty} × ${i.name}`),
      ])
    : [`📦 ${o.hubAddress}`];

  return [
    `Hi ${o.riderName}, delivery job from ${o.storeName} — order ${o.orderNumber}.`,
    "",
    "PICKUP:",
    ...pickupLines,
    "",
    "DELIVER TO:",
    `👤 ${o.customer.name} — ${formatNgPhone(o.customer.phone)}`,
    `📍 ${o.customer.address}${o.customer.zone ? ` (${o.customer.zone})` : ""}`,
    ...(o.customer.notes ? [`📝 ${o.customer.notes}`] : []),
    "",
    o.collectAmount !== null
      ? `💰 PAY ON DELIVERY: collect ${formatNaira(o.collectAmount)} from the customer.`
      : "✅ Already paid — do NOT collect money.",
    `Your fee: ${formatNaira(o.riderFee)}`,
  ].join("\n");
}

export function customerMessage(o: {
  storeName: string;
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  riderName?: string | null;
  riderPhone?: string | null;
  reviewUrl?: string; // included once delivered
}): string {
  const first = o.customerName.split(" ")[0];
  const hi = `Hi ${first}, this is ${o.storeName} about your order ${o.orderNumber}.`;
  switch (o.status) {
    case "new":
    case "vendor_confirmed":
      return `${hi}\nYour order is confirmed and we're preparing it for delivery. We'll update you when it's on the way.`;
    case "rider_assigned":
    case "picked_up":
      return [
        `${hi}\nGood news — your order is on the way! 🚚`,
        ...(o.riderName ? [`Rider: ${o.riderName}${o.riderPhone ? ` (${formatNgPhone(o.riderPhone)})` : ""}`] : []),
      ].join("\n");
    case "delivered":
    case "completed":
      return [
        `${hi}\nThanks for shopping with us! We hope you enjoy your work. 🙏 Any issues, just reply here.`,
        ...(o.reviewUrl ? ["", `Got a minute? Your review helps other buyers trust us ⭐\n${o.reviewUrl}`] : []),
      ].join("\n");
    default:
      return hi;
  }
}
