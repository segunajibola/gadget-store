"use client";

/**
 * Wraps a Server Action in a form with pending state + error/success message.
 *
 * Next pattern: a Server Component can pass a Server Action (a function
 * marked "use server") as a prop to a Client Component like this one.
 * Calling it runs the function on the server.
 *
 * We submit via onSubmit + startTransition instead of <form action={...}>
 * because React 19 auto-resets a form after an action — which would wipe
 * the admin's input when validation fails.
 */
import { startTransition, useActionState, type ReactNode } from "react";
import type { FormAction } from "@/lib/forms";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

export function ActionForm({
  action,
  children,
  submitLabel = "Save",
  className = "space-y-4",
}: {
  action: FormAction;
  children: ReactNode;
  submitLabel?: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      {children}

      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      {state?.message && <Alert tone="success">{state.message}</Alert>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
