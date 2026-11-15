"use client";

/**
 * Shown at checkout when the customer started a Paystack order but didn't
 * pay (pressed Cancel/Back on Paystack). Lets them finish paying, or cancel
 * that order — either keeping the cart to re-order, or emptying it.
 */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cartActions, pendingOrderActions, type PendingOrder } from "@/lib/cart";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { cancelOrder } from "./actions";

export function UnpaidOrderPanel({ order }: { order: PendingOrder }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<{ text: string; paid?: boolean } | null>(null);

  function cancel(keepCart: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await cancelOrder(order.id);
      if (!res.ok) {
        setError({ text: res.error ?? "Could not cancel the order.", paid: res.paid });
        return;
      }
      pendingOrderActions.clear(); // checkout form shows again
      if (!keepCart) {
        cartActions.clear();
        router.push("/products");
      }
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-lg border border-warning/30 bg-warning-50 p-6 text-center">
      <h2 className="text-lg font-semibold">You have an unpaid order</h2>
      <p className="text-sm text-slate-700">
        Order <strong className="font-mono text-slate-900">{order.orderNumber}</strong> is saved but hasn&apos;t
        been paid yet.
      </p>

      {error && (
        <Alert tone={error.paid ? "success" : "danger"}>
          {error.text}{" "}
          {error.paid && (
            <a href={`/order/${order.id}`} className="font-medium underline">
              View order
            </a>
          )}
        </Alert>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
        <ButtonLink href={`/order/${order.id}`}>Complete payment</ButtonLink>
        <Button variant="secondary" disabled={pending} onClick={() => cancel(true)}>
          {pending ? "Please wait…" : "Start a new order"}
        </Button>
        <Button variant="ghost" disabled={pending} onClick={() => cancel(false)}>
          Cancel order
        </Button>
      </div>
      <p className="text-xs text-slate-500">
        &ldquo;Start a new order&rdquo; cancels {order.orderNumber} and keeps your cart so you can check out again.
      </p>
    </div>
  );
}
