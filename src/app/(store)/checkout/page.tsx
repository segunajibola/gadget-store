import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

// Placeholder — real checkout (delivery details, Paystack, pay on delivery) is stage 4.
export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Checkout is coming soon</h1>
      <p className="mt-2 text-slate-500">This page is built in the next stage.</p>
      <ButtonLink href="/cart" variant="secondary" className="mt-6">
        Back to cart
      </ButtonLink>
    </div>
  );
}
