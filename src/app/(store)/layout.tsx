/**
 * Shared layout for all customer-facing pages: header, footer, WhatsApp button.
 * "(store)" is a route group — the folder name isn't in the URL, so
 * app/(store)/page.tsx is the home page "/".
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TAGLINE } from "@/lib/brand";
import { getSettings } from "@/lib/store";
import { Footer } from "@/components/store/Footer";
import { Header } from "@/components/store/Header";
import { WhatsAppFloat } from "@/components/store/WhatsApp";

// generateMetadata lets metadata depend on data (here: the store name).
export async function generateMetadata(): Promise<Metadata> {
  const { storeName } = await getSettings();
  return {
    // `absolute` stops the root layout's "%s | …" template wrapping this title;
    // `template` is then used for every storefront page below this layout.
    title: { absolute: `${storeName} — ${TAGLINE}`, template: `%s | ${storeName}` },
    description:
      "Laptops, accessories, networking and power gear from vetted Computer Village vendors, delivered fast across Lagos.",
    openGraph: { siteName: storeName, locale: "en_NG", type: "website" },
  };
}

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-brand-700"
      >
        Skip to content
      </a>
      <Header storeName={settings.storeName} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer settings={settings} />
      <WhatsAppFloat phone={settings.whatsappNumber} storeName={settings.storeName} />
    </>
  );
}
