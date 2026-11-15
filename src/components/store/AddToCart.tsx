"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { cartActions } from "@/lib/cart";
import { Button } from "@/components/ui/Button";
import { QtyStepper } from "./QtyStepper";

export function AddToCart({
  product,
  disabled,
}: {
  product: { productId: string; slug: string; name: string; price: number; image: string | null };
  disabled?: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (disabled) {
    return (
      <Button size="lg" disabled className="w-full sm:w-auto">
        Out of stock
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <QtyStepper value={qty} onChange={setQty} />
        <Button
          size="lg"
          className="flex-1 sm:flex-none"
          onClick={() => {
            cartActions.add(product, qty);
            setAdded(true);
          }}
        >
          <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          Add to cart
        </Button>
      </div>
      {added && (
        <p className="text-sm text-success-700" role="status">
          Added to cart.{" "}
          <Link href="/cart" className="font-medium text-brand-600 underline hover:text-brand-700">
            View cart &amp; checkout
          </Link>
        </p>
      )}
    </div>
  );
}
