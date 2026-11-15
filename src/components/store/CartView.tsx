"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ImageOff, ShoppingCart, Trash } from "lucide-react";
import { cartActions, useCart, useHydrated } from "@/lib/cart";
import { createClient } from "@/lib/supabase/browser";
import { productImageUrl } from "@/lib/images";
import { formatNaira } from "@/lib/money";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { QtyStepper } from "./QtyStepper";

type Availability = Record<string, "available" | "out_of_stock" | "removed">;

export function CartView() {
  const hydrated = useHydrated();
  const { items, count, subtotal } = useCart();
  const [availability, setAvailability] = useState<Availability>({});

  // Re-check prices and stock with the live catalogue whenever the set of
  // products in the cart changes (prices may have changed since adding).
  const ids = items.map((i) => i.productId).sort().join(",");
  useEffect(() => {
    if (!ids) return;
    let cancelled = false;
    createClient()
      .from("public_products")
      .select("id, name, slug, selling_price, stock_status, images")
      .in("id", ids.split(","))
      .then(({ data }) => {
        if (cancelled || !data) return;
        const fresh = new Map(
          data.map((p) => {
            const imgs = (p.images as { path: string }[] | null) ?? [];
            return [
              p.id!,
              {
                name: p.name!,
                slug: p.slug!,
                price: p.selling_price!,
                image: imgs[0] ? productImageUrl(imgs[0].path) : null,
              },
            ];
          }),
        );
        cartActions.refresh(fresh);
        const next: Availability = {};
        for (const id of ids.split(",")) {
          const p = data.find((d) => d.id === id);
          next[id] = p ? (p.stock_status ?? "available") : "removed";
        }
        setAvailability(next);
      });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (!hydrated) {
    return <p className="py-12 text-center text-slate-500">Loading your cart…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-16 text-center">
        <ShoppingCart className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
        <p className="mt-3 font-medium text-slate-900">Your cart is empty</p>
        <p className="mt-1 text-sm text-slate-500">Find something you&apos;ll enjoy working with.</p>
        <ButtonLink href="/products" className="mt-6">
          Browse products
        </ButtonLink>
      </div>
    );
  }

  const blocked = items.some((i) => availability[i.productId] && availability[i.productId] !== "available");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {items.map((item) => {
          const status = availability[item.productId];
          return (
            <li key={item.productId} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
              <Link
                href={`/products/${item.slug}`}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-slate-50 sm:h-24 sm:w-24"
              >
                {item.image ? (
                  <Image src={item.image} alt="" fill sizes="96px" className="object-contain p-1" />
                ) : (
                  <ImageOff className="m-auto h-full w-8 text-slate-300" aria-hidden="true" />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/products/${item.slug}`} className="font-medium text-slate-900 hover:text-brand-700">
                    {item.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => cartActions.remove(item.productId)}
                    aria-label={`Remove ${item.name}`}
                    className="rounded p-1 text-slate-400 hover:text-danger-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <Trash className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                {status === "out_of_stock" && <Badge tone="danger">Out of stock — please remove</Badge>}
                {status === "removed" && <Badge tone="danger">No longer available — please remove</Badge>}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                  <QtyStepper value={item.qty} onChange={(n) => cartActions.setQty(item.productId, n)} />
                  <p className="font-bold text-slate-900">{formatNaira(item.price * item.qty)}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="font-semibold">Order summary</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Items ({count})</dt>
            <dd className="font-medium text-slate-900">{formatNaira(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-slate-500">
            <dt>Delivery</dt>
            <dd>Calculated at checkout</dd>
          </div>
        </dl>
        <div className="flex justify-between border-t border-slate-200 pt-3">
          <span className="font-semibold text-slate-900">Subtotal</span>
          <span className="text-lg font-bold text-slate-900">{formatNaira(subtotal)}</span>
        </div>
        {blocked && <Alert tone="danger">Remove unavailable items to continue.</Alert>}
        <ButtonLink
          href="/checkout"
          size="lg"
          className="w-full"
          aria-disabled={blocked}
          tabIndex={blocked ? -1 : undefined}
        >
          Proceed to checkout
        </ButtonLink>
        <Link href="/products" className="block text-center text-sm text-brand-600 hover:text-brand-700 hover:underline">
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
