import Link from "next/link";
import type { ReactNode } from "react";
import { btnPrimary } from "@/components/ui/styles";

export function PageHeader({
  title,
  newHref,
  newLabel = "Add new",
  back,
  children,
}: {
  title: string;
  newHref?: string;
  newLabel?: string;
  back?: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 space-y-2">
      {back && (
        <Link href={back.href} className="text-sm text-gray-500 hover:text-gray-800">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <div className="flex items-center gap-2">
          {children}
          {newHref && (
            <Link href={newHref} className={btnPrimary}>
              {newLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/** Green/grey pill for active/inactive etc. */
export function Badge({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        on ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
      }`}
    >
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
      {children}
    </p>
  );
}
