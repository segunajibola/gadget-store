/**
 * Detects the demo/placeholder values seeded by migration 0007, so admin can
 * show a "replace before launch" reminder.
 */
export function placeholderFields(s: {
  cac_number: string | null;
  business_address: string | null;
  instagram_handle: string | null;
}): string[] {
  const out: string[] = [];
  if (s.cac_number?.includes("0000000")) out.push("CAC number");
  if (s.business_address?.includes("Example Plaza")) out.push("business address");
  if (s.instagram_handle?.includes("placeholder")) out.push("Instagram handle");
  return out;
}
