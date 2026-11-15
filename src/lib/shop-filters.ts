/**
 * "Shop by budget" ranges, used on the home page and the product list.
 * Values are in NAIRA (they appear in URLs: /products?min=250000&max=500000).
 */
export const BUDGET_RANGES = [
  { key: "u250", label: "Under ₦250k", min: undefined, max: 250_000 },
  { key: "250-500", label: "₦250k – ₦500k", min: 250_000, max: 500_000 },
  { key: "500-1m", label: "₦500k – ₦1m", min: 500_000, max: 1_000_000 },
  { key: "1m+", label: "₦1m and above", min: 1_000_000, max: undefined },
] as const;

export function budgetHref(r: (typeof BUDGET_RANGES)[number], category?: string): string {
  const sp = new URLSearchParams();
  if (category) sp.set("category", category);
  if (r.min) sp.set("min", String(r.min));
  if (r.max) sp.set("max", String(r.max));
  return `/products?${sp}`;
}

/** Label for a min/max pair, e.g. "₦250k – ₦500k" or "Under ₦250k". */
export function budgetLabel(min?: number, max?: number): string | null {
  const match = BUDGET_RANGES.find((r) => (r.min ?? undefined) === min && (r.max ?? undefined) === max);
  if (match) return match.label;
  if (min && max) return `₦${min.toLocaleString()} – ₦${max.toLocaleString()}`;
  if (max) return `Under ₦${max.toLocaleString()}`;
  if (min) return `₦${min.toLocaleString()}+`;
  return null;
}
