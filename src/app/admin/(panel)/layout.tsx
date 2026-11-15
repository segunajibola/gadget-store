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
import { LogoMark } from "@/components/ui/Logo";
import { AdminNav } from "./AdminNav";
import { getNavCounts } from "./nav-actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  const counts = await getNavCounts(); // first paint; AdminNav keeps them fresh

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2 font-semibold text-slate-900">
            <LogoMark size={28} />
            <span>
              Gadget<span className="text-brand-600">Store</span>
              <span className="ml-2 text-xs font-normal text-slate-500">Admin</span>
            </span>
          </Link>
          <AdminNav initialCounts={counts} />
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
