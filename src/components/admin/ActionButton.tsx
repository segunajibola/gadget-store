"use client";

/**
 * A button that runs a Server Action and shows its result.
 * Pass a pre-bound action from a Server Component, e.g.
 *   <ActionButton action={markOrderPaid.bind(null, order.id)} label="Mark as paid" />
 * (.bind fixes the first argument; the action still runs on the server.)
 */
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button, type ButtonVariant } from "@/components/ui/Button";

type Result = { ok: true; message?: string } | { ok: false; error: string };

export function ActionButton({
  action,
  label,
  variant = "secondary",
  confirmText,
}: {
  action: () => Promise<Result>;
  label: string;
  variant?: ButtonVariant;
  confirmText?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);

  return (
    <div className="space-y-2">
      <Button
        variant={variant}
        disabled={pending}
        onClick={() => {
          if (confirmText && !confirm(confirmText)) return;
          startTransition(async () => setResult(await action()));
        }}
      >
        {pending ? "Working…" : label}
      </Button>
      {result && !result.ok && <Alert tone="danger">{result.error}</Alert>}
      {result?.ok && result.message && <Alert tone="success">{result.message}</Alert>}
    </div>
  );
}
