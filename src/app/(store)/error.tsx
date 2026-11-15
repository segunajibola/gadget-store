"use client";

/**
 * Shown when something on a storefront page fails (e.g. the database is
 * briefly unreachable). It renders inside the store layout, so the header,
 * footer and WhatsApp button are still there. error.tsx must be a Client
 * Component; `reset` re-tries rendering the page.
 */
import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <p className="text-sm font-semibold text-brand-600">Something went wrong</p>
      <h1 className="mt-2 text-2xl font-bold">We couldn&apos;t load this page</h1>
      <p className="mt-2 text-slate-700">
        This is usually temporary. Please try again — or tap the WhatsApp button and we&apos;ll help you directly.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Go home
        </ButtonLink>
      </div>
    </div>
  );
}
