/**
 * Layout for every admin page except /admin/login.
 *
 * "(panel)" is a route group: the parentheses mean the folder name is NOT
 * part of the URL. It lets these pages share this layout (nav + auth check)
 * while /admin/login stays outside it.
 */
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth";
import { logout } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/riders", label: "Riders" },
  { href: "/admin/zones", label: "Zones" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/admin" className="font-semibold text-slate-900">
            Gadget<span className="text-brand-600">Store</span>
            <span className="ml-2 text-xs font-normal text-slate-500">Admin</span>
          </Link>
          {/* Scrolls sideways on small phones instead of wrapping into a mess */}
          <nav className="-mx-1 flex flex-1 gap-1 overflow-x-auto text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded px-2 py-1 text-slate-700 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={logout} className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-500 sm:inline">{admin.email}</span>
            <Button type="submit" variant="ghost" size="sm">
              Log out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
