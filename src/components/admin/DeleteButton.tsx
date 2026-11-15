"use client";

/**
 * Calls a delete Server Action after a browser confirm().
 * The action receives FormData with the hidden `id`.
 */
import { useTransition } from "react";
import { Button } from "@/components/ui/Button";

export function DeleteButton({
  id,
  action,
  label = "Delete",
  confirmText = "Delete this item? This cannot be undone.",
}: {
  id: string;
  action: (formData: FormData) => Promise<void>;
  label?: string;
  confirmText?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="danger"
      disabled={pending}
      onClick={() => {
        if (!confirm(confirmText)) return;
        const fd = new FormData();
        fd.set("id", id);
        startTransition(() => action(fd));
      }}
    >
      {pending ? "Deleting…" : label}
    </Button>
  );
}
