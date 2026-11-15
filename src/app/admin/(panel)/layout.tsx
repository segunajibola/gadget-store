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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/admin" className="font-semibold">
            Gadget Store · Admin
          </Link>
          {/* Scrolls sideways on small phones instead of wrapping into a mess */}
          <nav className="-mx-1 flex flex-1 gap-1 overflow-x-auto text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded px-2 py-1 text-gray-700 hover:bg-gray-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={logout} className="flex items-center gap-3 text-sm">
            <span className="hidden text-gray-500 sm:inline">{admin.email}</span>
            <button type="submit" className="text-gray-700 underline hover:text-black">
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
