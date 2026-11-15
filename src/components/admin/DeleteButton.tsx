"use client";

/**
 * Small form that calls a delete Server Action after a browser confirm().
 * The action receives FormData with the hidden `id`.
 */
import { useTransition } from "react";
import { btnDanger } from "@/components/ui/styles";

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
    <button
      type="button"
      className={btnDanger}
      disabled={pending}
      onClick={() => {
        if (!confirm(confirmText)) return;
        const fd = new FormData();
        fd.set("id", id);
        startTransition(() => action(fd));
      }}
    >
      {pending ? "Deleting…" : label}
    </button>
  );
}
