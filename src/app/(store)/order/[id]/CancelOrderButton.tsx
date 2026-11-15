"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { pendingOrderActions } from "@/lib/cart";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { cancelOrder } from "@/app/(store)/checkout/actions";

/** "Cancel order" for an unpaid online order, on the order page. */
export function CancelOrderButton({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="lg"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Cancel order ${orderNumber}? Your cart items will be kept.`)) return;
          setError(null);
          startTransition(async () => {
            const res = await cancelOrder(orderId);
            if (!res.ok) {
              setError(res.error ?? "Could not cancel the order.");
              if (res.paid) router.refresh(); // it turned out to be paid — show that
              return;
            }
            pendingOrderActions.clear();
            router.refresh(); // re-render the page showing "Order cancelled"
          });
        }}
      >
        {pending ? "Cancelling…" : "Cancel order"}
      </Button>
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}
