/**
 * Order status rules — which status can follow which.
 * Used by the admin UI (to show only valid buttons) AND re-checked in the
 * Server Action, so an invalid jump can't be forced.
 *
 *   new → vendor_confirmed → rider_assigned → picked_up → delivered → completed
 *   cancelled / returned are side exits.
 */
import type { OrderStatus } from "@/lib/constants";

export const MAIN_FLOW: OrderStatus[] = [
  "new",
  "vendor_confirmed",
  "rider_assigned",
  "picked_up",
  "delivered",
  "completed",
];

export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  new: ["vendor_confirmed", "cancelled"],
  // Back-steps let you switch vendor/rider when plans fall through.
  vendor_confirmed: ["rider_assigned", "new", "cancelled"],
  rider_assigned: ["picked_up", "vendor_confirmed", "cancelled"],
  picked_up: ["delivered", "returned", "cancelled"],
  delivered: ["completed", "returned"],
  completed: ["returned"],
  cancelled: [],
  returned: [],
};

/** Button text for moving TO a status. */
export const STATUS_ACTION_LABEL: Record<OrderStatus, string> = {
  new: "Reopen",
  vendor_confirmed: "Vendor confirmed",
  rider_assigned: "Rider assigned",
  picked_up: "Picked up",
  delivered: "Delivered",
  completed: "Complete order",
  cancelled: "Cancel order",
  returned: "Mark returned",
};

/** Orders that count toward revenue & profit. */
export const REVENUE_STATUSES: OrderStatus[] = ["delivered", "completed"];

export const IN_PROGRESS_STATUSES: OrderStatus[] = ["vendor_confirmed", "rider_assigned", "picked_up"];

/** True when `to` is an earlier step of the main flow than `from`. */
export function isBackStep(from: OrderStatus, to: OrderStatus): boolean {
  const a = MAIN_FLOW.indexOf(from);
  const b = MAIN_FLOW.indexOf(to);
  return a !== -1 && b !== -1 && b < a;
}

/** Button text for a specific move, e.g. "← Back to New (vendor fell through)". */
export function transitionLabel(from: OrderStatus, to: OrderStatus): string {
  if (from === "vendor_confirmed" && to === "new") return "← Back to New (change vendor)";
  if (from === "rider_assigned" && to === "vendor_confirmed") return "← Back (change rider)";
  return STATUS_ACTION_LABEL[to];
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return NEXT_STATUSES[from].includes(to);
}
