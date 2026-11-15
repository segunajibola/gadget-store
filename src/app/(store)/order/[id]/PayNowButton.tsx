"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { retryPayment } from "@/app/(store)/checkout/actions";

/** Starts a new Paystack attempt for an unpaid order. */
export function PayNowButton({ orderId, label }: { orderId: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await retryPayment(orderId);
            if (res.url) window.location.assign(res.url);
            else setError(res.error ?? "Could not start payment");
          })
        }
      >
        {pending ? "Opening Paystack…" : label}
      </Button>
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}
