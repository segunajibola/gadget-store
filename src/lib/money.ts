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

/**
 * Strict naira amount format:
 *  - digits, optionally with commas as THOUSANDS separators: 300000 or 300,000
 *  - optionally ONE decimal point with 1–2 digits (kobo): 300000.5, 300,000.50
 *  - "₦" and spaces are ignored
 * Rejected: "1,00,00.0,0", "300.000.00", "30,00", "1.234", "-5", "abc".
 */
const NAIRA_PATTERN = /^(\d{1,3}(,\d{3})+|\d+)(\.\d{1,2})?$/;

/** Admin input "1,250,000" or "1250000.50" → kobo integer. Returns null if invalid. */
export function nairaToKobo(input: string | number): number | null {
  if (typeof input === "number") {
    return Number.isFinite(input) && input >= 0 ? Math.round(input * 100) : null;
  }
  const s = input.replace(/[₦\s]/g, "");
  if (!NAIRA_PATTERN.test(s)) return null;
  return Math.round(Number(s.replace(/,/g, "")) * 100);
}

export const NAIRA_FORMAT_HINT = "Use digits, e.g. 300000 or 300,000 (commas only between thousands, optional .50 for kobo).";

/** kobo → plain naira number for form inputs, e.g. 125000000 → 1250000 */
export function koboToNaira(kobo: number): number {
  return kobo / 100;
}
