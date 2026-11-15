import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { TAGLINE } from "@/lib/brand";
import { formatNgPhone, waLink } from "@/lib/phone";
import type { StoreSettings } from "@/lib/store";
import { LogoMark } from "@/components/ui/Logo";
import { POLICY_LINKS } from "./PolicyPage";
import { InstagramIcon, WhatsAppIcon } from "./WhatsApp";

export function Footer({ settings: s }: { settings: StoreSettings }) {
  const linkCls = "text-brand-100 hover:text-white hover:underline";
  return (
    <footer className="mt-16 bg-brand-900 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-lg font-semibold text-white">
            <LogoMark size={36} variant="white" />
            {s.storeName}
          </p>
          <p className="text-brand-100">{TAGLINE}.</p>
          <ul className="space-y-1.5 text-sm text-brand-100">
            {s.businessAddress && (
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {s.businessAddress}
              </li>
            )}
            {s.businessHours && (
              <li className="flex gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {s.businessHours}
              </li>
            )}
            {s.cacNumber && <li className="text-brand-200">Registered business · {s.cacNumber}</li>}
          </ul>
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
            <li>
              <Link href="/products?deals=1" className={linkCls}>Hot deals</Link>
            </li>
            <li>
              <Link href="/laptop-finder" className={linkCls}>Laptop finder</Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Help">
          <p className="mb-2 font-medium text-white">Help</p>
          <ul className="space-y-1 text-sm">
            {POLICY_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkCls}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="mb-2 font-medium text-white">Talk to us</p>
          <ul className="space-y-1.5 text-sm">
            <li>
              <a
                href={waLink(s.whatsappNumber, `Hi ${s.storeName}, I have a question.`)}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 ${linkCls}`}
              >
                <WhatsAppIcon className="h-4 w-4" /> WhatsApp {formatNgPhone(s.whatsappNumber)}
              </a>
            </li>
            {s.instagramHandle && (
              <li>
                <a
                  href={`https://instagram.com/${s.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 ${linkCls}`}
                >
                  <InstagramIcon className="h-4 w-4" /> @{s.instagramHandle}
                </a>
              </li>
            )}
            {s.supportEmail && (
              <li>
                <a href={`mailto:${s.supportEmail}`} className={linkCls}>{s.supportEmail}</a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-brand-800">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-brand-200">
          © {new Date().getFullYear()} {s.storeName}. Lagos, Nigeria. Secure payments by Paystack.
        </p>
      </div>
    </footer>
  );
}
