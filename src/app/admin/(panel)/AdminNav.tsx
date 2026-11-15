"use client";

/**
 * Admin menu with live badge counts. Layouts don't re-render when you move
 * between pages, so the counts are refreshed here on every page change and
 * every minute.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getNavCounts, type NavCounts } from "./nav-actions";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders", badge: "orders" as const },
  { href: "/admin/leads", label: "Leads", badge: "leads" as const },
  { href: "/admin/reviews", label: "Reviews", badge: "reviews" as const },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/riders", label: "Riders" },
  { href: "/admin/zones", label: "Zones" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav({ initialCounts }: { initialCounts: NavCounts }) {
  const pathname = usePathname();
  const [counts, setCounts] = useState(initialCounts);

  useEffect(() => {
    let alive = true;
    const refresh = () => getNavCounts().then((c) => alive && setCounts(c)).catch(() => {});
    refresh();
    const timer = setInterval(refresh, 60_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [pathname]);

  return (
    <nav className="-mx-1 flex flex-1 gap-1 overflow-x-auto text-sm">
      {NAV.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const n = item.badge ? counts[item.badge] : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-1 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              active ? "bg-brand-50 font-medium text-brand-700" : "text-slate-700"
            }`}
          >
            {item.label}
            {n > 0 && (
              <span
                className="min-w-5 rounded-full bg-warning-50 px-1.5 text-center text-xs font-semibold text-warning-700 ring-1 ring-inset ring-warning/30"
                aria-label={`${n} waiting`}
              >
                {n}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
