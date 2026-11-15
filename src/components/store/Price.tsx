import { formatNaira } from "@/lib/money";
import { discountPercent, type Product } from "@/lib/products";

/** Price, plus crossed-out "was" price when the product is on deal. */
export function Price({
  product,
  size = "md",
}: {
  product: Pick<Product, "price" | "compareAtPrice">;
  size?: "md" | "lg";
}) {
  const off = discountPercent(product);
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <span className={`font-bold text-slate-900 ${size === "lg" ? "text-3xl" : "text-base"}`}>
        {formatNaira(product.price)}
      </span>
      {off > 0 && (
        <span className={`text-slate-500 line-through ${size === "lg" ? "text-lg" : "text-sm"}`}>
          <span className="sr-only">Was </span>
          {formatNaira(product.compareAtPrice!)}
        </span>
      )}
    </p>
  );
}
