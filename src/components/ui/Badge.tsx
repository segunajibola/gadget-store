/**
 * Badges: light background + dark text of the same colour.
 *
 *   <Badge tone="success">In stock</Badge>
 *   <OrderStatusBadge status="picked_up" />
 *   <StockBadge status="out_of_stock" />
 *
 * Tone rules (see CLAUDE.md "Brand & Design"):
 *   success — in stock, delivered, completed, paid
 *   warning — pending, new order awaiting action
 *   danger  — out of stock, cancelled, returned, payment failed
 *   brand   — in-progress order states, selected chips, light highlights
 *   accent  — ONLY "Hot deal" / "Featured" / discounts
 *   neutral — everything else (hidden, inactive…)
 */
import type { ReactNode } from "react";
import {
  ORDER_STATUSES,
  STOCK_STATUSES,
  type OrderStatus,
  type StockStatus,
} from "@/lib/constants";

export type BadgeTone = "success" | "warning" | "danger" | "brand" | "accent" | "neutral";

const tones: Record<BadgeTone, string> = {
  success: "bg-success-50 text-success-700 ring-success/20",
  warning: "bg-warning-50 text-warning-700 ring-warning/20",
  danger: "bg-danger-50 text-danger-700 ring-danger/20",
  brand: "bg-brand-100 text-brand-800 ring-brand-600/20",
  accent: "bg-accent text-slate-900 ring-accent/30", // dark text on amber for AA contrast
  neutral: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

// ---------- Status → tone mappings (single source of truth) -----------------

export const ORDER_STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  new: "warning",
  vendor_confirmed: "brand",
  rider_assigned: "brand",
  picked_up: "brand",
  delivered: "success",
  completed: "success",
  cancelled: "danger",
  returned: "danger",
};

export const STOCK_STATUS_TONE: Record<StockStatus, BadgeTone> = {
  available: "success",
  out_of_stock: "danger",
};

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export const PAYMENT_STATUS_TONE: Record<PaymentStatus, BadgeTone> = {
  pending: "warning",
  paid: "success",
  failed: "danger",
  refunded: "neutral",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_STATUS_TONE[status]}>{ORDER_STATUSES[status]}</Badge>;
}

export function StockBadge({ status }: { status: StockStatus }) {
  return <Badge tone={STOCK_STATUS_TONE[status]}>{STOCK_STATUSES[status]}</Badge>;
}
