import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { ActionForm } from "@/components/admin/ActionForm";
import { Field } from "@/components/ui/Field";
import { LogoMark } from "@/components/ui/Logo";
import { inputCls } from "@/components/ui/styles";
import { login } from "./actions";

export const metadata: Metadata = { title: "Admin login", robots: { index: false } };

// In Next 15+, `searchParams` is a Promise — await it.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await getAdminUser()) redirect("/admin");
  const { next = "" } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <LogoMark size={56} priority />
          <h1 className="text-xl font-semibold">Admin login</h1>
        </div>
        <ActionForm action={login} submitLabel="Log in">
          <input type="hidden" name="next" value={next} />
          <Field label="Email">
            <input name="email" type="email" required autoComplete="email" className={inputCls} />
          </Field>
          <Field label="Password">
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={inputCls}
            />
          </Field>
        </ActionForm>
      </div>
    </main>
  );
}
