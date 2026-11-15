import Link from "next/link";
import { Briefcase, CodeXml, GraduationCap, Palette, type LucideIcon } from "lucide-react";
import { BUDGET_RANGES, budgetHref } from "@/lib/shop-filters";

const tile =
  "flex h-full flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

/** "Shop by budget" — how most buyers think about price. Laptops only. */
export function ShopByBudget() {
  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold">Laptops by budget</h3>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {BUDGET_RANGES.map((r) => (
          <li key={r.key}>
            <Link href={budgetHref(r, "laptops")} className={tile}>
              <span className="text-lg font-bold text-slate-900">{r.label}</span>
              <span className="text-sm text-brand-600">Shop laptops →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const NEEDS: { use: string; label: string; text: string; icon: LucideIcon }[] = [
  { use: "programming", label: "Programming", text: "16GB RAM, fast SSD, comfy keyboard", icon: CodeXml },
  { use: "office", label: "Students & school", text: "Light, reliable, great battery", icon: GraduationCap },
  { use: "business", label: "Office & business", text: "Durable business laptops", icon: Briefcase },
  { use: "design", label: "Design & video", text: "Strong processor & screen", icon: Palette },
];

/** "Shop by need" — opens the laptop finder with the use case pre-selected. */
export function ShopByNeed() {
  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold">Laptops by what you do</h3>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {NEEDS.map((n) => (
          <li key={n.use}>
            <Link href={`/laptop-finder?use=${n.use}`} className={tile}>
              <n.icon className="h-6 w-6 text-brand-600" aria-hidden="true" />
              <span className="font-semibold text-slate-900">{n.label}</span>
              <span className="text-sm text-slate-500">{n.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const BRANDS = ["Dell", "HP", "Lenovo", "Apple"];

/** Brand chips → product search. (Text only; brand logos are trademarks.) */
export function ShopByBrand() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-semibold text-slate-900">Popular brands:</span>
      {BRANDS.map((b) => (
        <Link
          key={b}
          href={`/products?q=${encodeURIComponent(b === "Apple" ? "MacBook" : b)}`}
          className="rounded-full border border-slate-200 bg-white px-5 py-2 font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {b}
        </Link>
      ))}
    </div>
  );
}
