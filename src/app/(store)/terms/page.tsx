// DRAFT — not legal advice. Have it reviewed before launch.
import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/store";
import { formatNaira } from "@/lib/money";
import { PolicyPage } from "@/components/store/PolicyPage";

export const metadata: Metadata = { title: "Terms of sale" };
export const revalidate = 3600;

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <PolicyPage title="Terms of sale" updated="November 2026">
      <section>
        <h2>Who we are</h2>
        <p>
          {s.storeName}
          {s.cacNumber ? ` (${s.cacNumber})` : ""} is an online store selling laptops and IT gadgets for delivery
          across Lagos, Nigeria. We don&apos;t have a walk-in shop
          {s.businessAddress ? <> — our location: {s.businessAddress}</> : null}.
        </p>
      </section>
      <section>
        <h2>Products & prices</h2>
        <ul>
          <li>Prices are in Naira and include VAT where applicable. Delivery fees are shown at checkout.</li>
          <li>We source items from vetted vendors. If an item becomes unavailable after you order, we&apos;ll offer an alternative or a full refund.</li>
          <li>Product photos are representative; the condition stated on the listing (New, UK-used, Refurbished) applies.</li>
        </ul>
      </section>
      <section>
        <h2>Orders & payment</h2>
        <ul>
          <li>An order is confirmed when we confirm it with you by phone or WhatsApp.</li>
          <li>Online payments are processed securely by Paystack. We never see or store your card details.</li>
          <li>Pay on delivery is available for orders up to {formatNaira(s.podMaxOrderValue)}.</li>
        </ul>
      </section>
      <section>
        <h2>Delivery</h2>
        <p>We deliver across Lagos. Delivery times are estimates and may be affected by traffic, weather or vendor availability.</p>
      </section>
      <section>
        <h2>Warranty & returns</h2>
        <p>See our <Link href="/warranty-returns">warranty & returns policy</Link>.</p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Questions about these terms? Chat with us on WhatsApp or email {s.supportEmail ?? "us"}.</p>
      </section>
    </PolicyPage>
  );
}
