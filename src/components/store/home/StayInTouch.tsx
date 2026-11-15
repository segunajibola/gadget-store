import { Megaphone } from "lucide-react";
import { waLink } from "@/lib/phone";
import type { StoreSettings } from "@/lib/store";
import { InstagramIcon, WhatsAppIcon } from "@/components/store/WhatsApp";

/** WhatsApp deals list + Instagram follow. */
export function StayInTouch({ settings: s }: { settings: StoreSettings }) {
  const joinHref =
    s.whatsappChannelUrl ??
    waLink(s.whatsappNumber, `Hi ${s.storeName}, please add me to your new arrivals & deals updates.`);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="touch-heading">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col rounded-xl border border-slate-200 p-6">
          <Megaphone className="h-6 w-6 text-brand-600" aria-hidden="true" />
          <h2 id="touch-heading" className="mt-3 text-xl font-bold">
            Get deals before anyone else
          </h2>
          <p className="mt-1 flex-1 text-slate-700">
            New arrivals and hot deals go out on WhatsApp first. No spam — leave anytime.
          </p>
          <a
            href={joinHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex w-fit items-center gap-2 rounded-md bg-whatsapp-700 px-5 py-2.5 font-medium text-white hover:bg-whatsapp-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <WhatsAppIcon className="h-5 w-5" />
            {s.whatsappChannelUrl ? "Follow our WhatsApp Channel" : "Join WhatsApp updates"}
          </a>
        </div>
        {s.instagramHandle && (
          <div className="flex flex-col rounded-xl border border-slate-200 p-6">
            <InstagramIcon className="h-6 w-6 text-brand-600" />
            <h2 className="mt-3 text-xl font-bold">See real deliveries on Instagram</h2>
            <p className="mt-1 flex-1 text-slate-700">
              Unboxings, new stock and happy customers across Lagos — follow{" "}
              <span className="font-medium text-slate-900">@{s.instagramHandle}</span>.
            </p>
            <a
              href={`https://instagram.com/${s.instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-fit items-center gap-2 rounded-md border border-brand-600 bg-white px-5 py-2.5 font-medium text-brand-600 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              <InstagramIcon className="h-5 w-5" /> Follow on Instagram
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
