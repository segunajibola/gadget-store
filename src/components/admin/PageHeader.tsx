import Link from "next/link";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/Button";

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
        <Link href={back.href} className="text-sm text-slate-500 hover:text-slate-900">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <div className="flex items-center gap-2">
          {children}
          {newHref && <ButtonLink href={newHref}>{newLabel}</ButtonLink>}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}
