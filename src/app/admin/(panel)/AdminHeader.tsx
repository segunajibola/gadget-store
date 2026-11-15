"use client";

/**
 * Admin header — never scrolls sideways:
 *  - Row 1: logo · email + log out (+ "Menu" button on phones)
 *  - Row 2: menu links that WRAP onto another line if needed (tablet/desktop);
 *    on phones the links open as a 2-column grid from the Menu button.
 *
 * Badge counts refresh on every page change and every minute (layouts don't
 * re-render on navigation, so the counts can't come from the server alone).
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/ui/Logo";
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

function CountBadge({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span
      className="min-w-5 rounded-full bg-warning-50 px-1.5 text-center text-xs font-semibold text-warning-700 ring-1 ring-inset ring-warning/30"
      aria-label={`${n} waiting`}
    >
      {n}
    </span>
  );
}

export function AdminHeader({
  email,
  initialCounts,
  logout,
}: {
  email: string;
  initialCounts: NavCounts;
  logout: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [counts, setCounts] = useState(initialCounts);
  const [open, setOpen] = useState(false);

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

  const total = counts.orders + counts.leads + counts.reviews;
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const links = NAV.map((item) => {
    const active = isActive(item.href);
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={() => setOpen(false)}
          aria-current={active ? "page" : undefined}
          className={`flex items-center justify-between gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
            active ? "bg-brand-50 font-medium text-brand-700" : "text-slate-700"
          }`}
        >
          {item.label}
          {item.badge && <CountBadge n={counts[item.badge]} />}
        </Link>
      </li>
    );
  });

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4">
        {/* Row 1 */}
        <div className="flex items-center justify-between gap-3 py-3">
          <Link href="/admin" className="flex min-w-0 items-center gap-2 font-semibold text-slate-900">
            <LogoMark size={28} />
            <span className="truncate">
              Gadget<span className="text-brand-600">Store</span>
              <span className="ml-2 text-xs font-normal text-slate-500">Admin</span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden max-w-56 truncate text-sm text-slate-500 lg:inline">{email}</span>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">
                Log out
              </Button>
            </form>
            <Button
              variant="secondary"
              size="sm"
              className="md:hidden"
              aria-expanded={open}
              aria-controls="admin-menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
              Menu
              {!open && <CountBadge n={total} />}
            </Button>
          </div>
        </div>

        {/* Row 2 — tablet & desktop: wraps, never scrolls */}
        <nav aria-label="Admin" className="hidden pb-2 md:block">
          <ul className="flex flex-wrap gap-1">{links}</ul>
        </nav>

        {/* Phones — opened from the Menu button */}
        {open && (
          <nav id="admin-menu" aria-label="Admin" className="border-t border-slate-100 py-2 md:hidden">
            <ul className="grid grid-cols-2 gap-1">{links}</ul>
          </nav>
        )}
      </div>
    </header>
  );
}
