import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { CONDITIONS } from "@/lib/constants";
import { Price } from "./Price";
import { discountPercent, type Product } from "@/lib/products";
import { Badge } from "@/components/ui/Badge";

export function ProductCard({ product }: { product: Product }) {
  const img = product.images[0];
  const soldOut = product.stockStatus === "out_of_stock";

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-brand-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="relative aspect-square bg-slate-50">
        {img ? (
          <Image
            src={img.url}
            alt={img.alt ?? product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className={`object-contain p-2 transition group-hover:scale-105 ${soldOut ? "opacity-60" : ""}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <ImageOff className="h-10 w-10" aria-hidden="true" />
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <Badge tone="brand">{CONDITIONS[product.condition]}</Badge>
          {soldOut && <Badge tone="danger">Out of stock</Badge>}
          {discountPercent(product) > 0 && <Badge tone="accent">-{discountPercent(product)}%</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-slate-900 group-hover:text-brand-700">
          {product.name}
        </h3>
        <div className="mt-auto pt-1">
          <Price product={product} />
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
