/**
 * Nigerian phone helpers. We store numbers in international format WITHOUT
 * "+" (e.g. 2348105729893) because that's what wa.me links need.
 */

/** "0810 572 9893", "+234 810…", "810…" → "2348105729893". null if invalid. */
export function normalizeNgPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (/^0[789]\d{9}$/.test(digits)) return "234" + digits.slice(1);
  if (/^234[789]\d{9}$/.test(digits)) return digits;
  if (/^[789]\d{9}$/.test(digits)) return "234" + digits;
  return null;
}

/** "2348105729893" → "08105729893" for display. */
export function formatNgPhone(intl: string): string {
  return intl.startsWith("234") ? "0" + intl.slice(3) : intl;
}

/** WhatsApp click-to-chat link with an optional pre-filled message. */
export function waLink(intlPhone: string, message?: string): string {
  const base = `https://wa.me/${intlPhone}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
