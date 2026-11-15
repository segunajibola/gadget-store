"use client";

import { useState, useTransition } from "react";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";
import { isBackStep, NEXT_STATUSES, transitionLabel } from "@/lib/order-flow";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { inputCls } from "@/components/ui/styles";
import { updateOrderStatus } from "../actions";

/**
 * Shows only the valid next steps for the current status.
 * `prepare` runs first (check what's on screen + save unsaved edits);
 * if it returns an error message, the status change is stopped.
 */
export function StatusPanel({
  orderId,
  status,
  prepare,
}: {
  orderId: string;
  status: OrderStatus;
  prepare?: (to: OrderStatus) => Promise<string | null>;
}) {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const next = NEXT_STATUSES[status];

  if (next.length === 0) {
    return <p className="text-sm text-slate-500">This order is {ORDER_STATUSES[status].toLowerCase()} — no further steps.</p>;
  }

  function go(to: OrderStatus) {
    const risky = to === "cancelled" || to === "returned";
    if (risky && !confirm(`${transitionLabel(status, to)}? This can't be undone.`)) return;
    setResult(null);
    startTransition(async () => {
      const problem = prepare ? await prepare(to) : null;
      if (problem) {
        setResult({ ok: false, text: problem });
        return;
      }
      const res = await updateOrderStatus(orderId, to, note);
      setResult(res.ok ? { ok: true, text: res.message ?? "Updated." } : { ok: false, text: res.error });
      if (res.ok) setNote("");
    });
  }

  const forward = next.filter((to) => !isBackStep(status, to) && to !== "cancelled" && to !== "returned");
  const other = next.filter((to) => !forward.includes(to));

  return (
    <div className="space-y-3">
      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Note (optional, saved to the timeline)</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Vendor confirmed on WhatsApp at ₦320k"
          className={inputCls}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {forward.map((to) => (
          <Button key={to} disabled={pending} onClick={() => go(to)}>
            {pending ? "Saving…" : `${transitionLabel(status, to)} →`}
          </Button>
        ))}
        {other.map((to) => (
          <Button
            key={to}
            disabled={pending}
            variant={to === "cancelled" ? "danger" : "secondary"}
            onClick={() => go(to)}
          >
            {transitionLabel(status, to)}
          </Button>
        ))}
      </div>
      {result && <Alert tone={result.ok ? "success" : "danger"}>{result.text}</Alert>}
    </div>
  );
}
