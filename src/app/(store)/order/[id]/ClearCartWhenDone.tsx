"use client";

import { useEffect } from "react";
import { cartActions, pendingOrderActions } from "@/lib/cart";

/**
 * Rendered on the order page once the order is final (paid online, or
 * pay-on-delivery). Empties the cart and forgets the "unpaid order" note.
 * Renders nothing.
 */
export function ClearCartWhenDone({ orderId }: { orderId: string }) {
  useEffect(() => {
    cartActions.clear();
    pendingOrderActions.clear();
  }, [orderId]);
  return null;
}
