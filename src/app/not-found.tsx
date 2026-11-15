import { ButtonLink } from "@/components/ui/Button";

// Shown for any unknown URL and when a page calls notFound().
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="text-2xl font-bold">We couldn&apos;t find that page</h1>
      <p className="text-slate-500">It may have moved, or the item is no longer listed.</p>
      <div className="mt-4 flex gap-3">
        <ButtonLink href="/">Go home</ButtonLink>
        <ButtonLink href="/products" variant="secondary">
          Browse products
        </ButtonLink>
      </div>
    </main>
  );
}
