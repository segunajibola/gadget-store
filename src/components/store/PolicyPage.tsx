import type { ReactNode } from "react";
import Link from "next/link";

/** Layout for text pages (warranty, terms, privacy, guides). */
export function PolicyPage({ title, intro, updated, children }: { title: string; intro?: string; updated?: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">{title}</h1>
      {updated && <p className="mt-1 text-sm text-slate-500">Last updated: {updated}</p>}
      {intro && <p className="mt-4 text-lg text-slate-700">{intro}</p>}
      <div className="mt-8 space-y-8 text-slate-700 [&_a]:text-brand-600 [&_a]:underline [&_a:hover]:text-brand-700 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-relaxed [&_section]:space-y-3 [&_ul]:space-y-1.5">
        {children}
      </div>
    </article>
  );
}

export const POLICY_LINKS = [
  { href: "/track", label: "Track your order" },
  { href: "/warranty-returns", label: "Warranty & returns" },
  { href: "/buying-guide", label: "New vs UK-used vs refurbished" },
  { href: "/terms", label: "Terms of sale" },
  { href: "/privacy", label: "Privacy policy" },
];

export function PolicyLinks() {
  return (
    <ul className="space-y-1">
      {POLICY_LINKS.map((l) => (
        <li key={l.href}>
          <Link href={l.href}>{l.label}</Link>
        </li>
      ))}
    </ul>
  );
}
