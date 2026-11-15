import type { Metadata } from "next";
import { CartView } from "@/components/store/CartView";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

// The page shell is a Server Component; the cart itself lives in the browser
// (localStorage), so <CartView> is a Client Component.
export default function CartPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">Your cart</h1>
      <CartView />
    </div>
  );
}
