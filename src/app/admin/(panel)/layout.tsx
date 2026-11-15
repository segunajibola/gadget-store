/**
 * Layout for every admin page except /admin/login.
 *
 * "(panel)" is a route group: the parentheses mean the folder name is NOT
 * part of the URL. It lets these pages share this layout (nav + auth check)
 * while /admin/login stays outside it.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth";
import { logout } from "@/app/admin/login/actions";
import { AdminHeader } from "./AdminHeader";
import { getNavCounts } from "./nav-actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  const counts = await getNavCounts(); // first paint; AdminHeader keeps them fresh

  return (
    <div className="min-h-screen bg-slate-50">
      {/* A Server Action (logout) can be passed to a Client Component as a prop. */}
      <AdminHeader email={admin.email} initialCounts={counts} logout={logout} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
