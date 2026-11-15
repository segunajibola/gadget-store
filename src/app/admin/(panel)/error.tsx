"use client";

import { useEffect } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

/** Admin page failed to load — show the reason and a retry button. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">This page couldn&apos;t load</h1>
      <Alert tone="danger">
        {error.message || "Unexpected error."}
        {error.digest && <span className="block text-xs">Reference: {error.digest}</span>}
      </Alert>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
