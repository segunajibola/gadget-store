/**
 * Money helpers. All amounts in the app and database are INTEGER KOBO.
 * Convert only at the edges: formatting for display, parsing admin input.
 */

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  currencyDisplay: "narrowSymbol", // "₦" rather than "NGN"
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** 125000000 → "₦1,250,000" ; 150050 → "₦1,500.5" */
export function formatNaira(kobo: number): string {
  return nairaFormatter.format(kobo / 100);
}

/** Admin input "1,250,000" or "1250000.50" → kobo integer. Returns null if invalid. */
export function nairaToKobo(input: string | number): number | null {
  const n = typeof input === "number" ? input : Number(String(input).replace(/[₦,\s]/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** kobo → plain naira number for form inputs, e.g. 125000000 → 1250000 */
export function koboToNaira(kobo: number): number {
  return kobo / 100;
}
