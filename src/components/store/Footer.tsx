import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { HUB_LABEL, TAGLINE } from "@/lib/brand";
import { formatNgPhone, waLink } from "@/lib/phone";
import type { StoreSettings } from "@/lib/store";
import { WhatsAppIcon } from "./WhatsApp";

export function Footer({ settings }: { settings: StoreSettings }) {
  const linkCls = "text-brand-100 hover:text-white hover:underline";
  return (
    <footer className="mt-16 bg-brand-900 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-lg font-semibold text-white">{settings.storeName}</p>
          <p className="mt-1 text-brand-100">{TAGLINE}.</p>
          <p className="mt-3 text-sm text-brand-200">
            Vetted vendors · Fast Lagos delivery · Dispatched from {HUB_LABEL}
          </p>
        </div>

        <nav aria-label="Shop">
          <p className="mb-2 font-medium text-white">Shop</p>
          <ul className="space-y-1 text-sm">
            {Object.entries(CATEGORIES).map(([value, label]) => (
              <li key={value}>
                <Link href={`/products?category=${value}`} className={linkCls}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="mb-2 font-medium text-white">Talk to us</p>
          <a
            href={waLink(settings.whatsappNumber, `Hi ${settings.storeName}, I have a question.`)}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 text-sm ${linkCls}`}
          >
            <WhatsAppIcon className="h-4 w-4" />
            WhatsApp {formatNgPhone(settings.whatsappNumber)}
          </a>
          {settings.supportEmail && (
            <a href={`mailto:${settings.supportEmail}`} className={`mt-1 block text-sm ${linkCls}`}>
              {settings.supportEmail}
            </a>
          )}
        </div>
      </div>
      <div className="border-t border-brand-800">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-brand-200">
          © {new Date().getFullYear()} {settings.storeName}. Lagos, Nigeria.
        </p>
      </div>
    </footer>
  );
}
