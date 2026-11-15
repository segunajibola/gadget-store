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
  vendor_confirmed: ["rider_assigned", "cancelled"],
  rider_assigned: ["picked_up", "cancelled"],
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

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return NEXT_STATUSES[from].includes(to);
}
