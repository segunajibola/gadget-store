import { BadgeCheck, Clock, Lock, MapPin } from "lucide-react";
import type { StoreSettings } from "@/lib/store";

/** Thin credibility bar under the hero: CAC number, address, hours, secure payments. */
export function TrustStrip({ settings: s }: { settings: StoreSettings }) {
  const items = [
    s.cacNumber && { icon: BadgeCheck, text: `CAC registered · ${s.cacNumber}` },
    s.businessAddress && { icon: MapPin, text: s.businessAddress },
    s.businessHours && { icon: Clock, text: s.businessHours },
    { icon: Lock, text: "Secure payments by Paystack" },
  ].filter(Boolean) as { icon: typeof Lock; text: string }[];

  return (
    <section aria-label="About our business" className="border-b border-slate-200 bg-slate-50">
      <ul className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-6 gap-y-2 px-4 py-3 text-sm text-slate-700">
        {items.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-1.5">
            <Icon className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}
