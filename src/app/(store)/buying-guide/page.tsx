// DRAFT — review before launch.
import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/store/PolicyPage";

export const metadata: Metadata = {
  title: "New vs UK-used vs refurbished laptops",
  description: "What New, UK-used and Refurbished mean when buying a laptop in Lagos — and which one is right for you.",
};

export default function BuyingGuidePage() {
  return (
    <PolicyPage
      title="New, UK-used or refurbished?"
      intro="Every listing on our site states its condition. Here's what each one means, so you know exactly what you're getting."
    >
      <section>
        <h2>New</h2>
        <p>
          Brand new and sealed in the original box, never used. Usually comes with the manufacturer&apos;s warranty.
          Best if you want the latest model and the longest life.
        </p>
      </section>
      <section>
        <h2>UK-used</h2>
        <p>
          Pre-owned laptops imported from the UK and Europe — very often business laptops (Dell Latitude, HP EliteBook,
          Lenovo ThinkPad) that companies replace every few years. They&apos;re built to last and offer excellent value.
          Expect light signs of use; the battery will hold a charge but won&apos;t be as long-lasting as new.
        </p>
      </section>
      <section>
        <h2>Refurbished</h2>
        <p>
          Used laptops that have been repaired or restored — for example a new battery, keyboard or screen — and tested
          before sale. A good middle ground between UK-used and new.
        </p>
      </section>
      <section>
        <h2>Which should I choose?</h2>
        <ul>
          <li><strong>Students & office work:</strong> a UK-used business laptop gives the best value.</li>
          <li><strong>Programming:</strong> prioritise 16GB RAM and an SSD — UK-used or refurbished works well.</li>
          <li><strong>Design & video:</strong> consider new or a recent refurbished model with a strong processor.</li>
        </ul>
        <p>
          Still unsure? Try our <Link href="/laptop-finder">laptop finder</Link> or chat with us — we&apos;ll help you pick.
          See our <Link href="/warranty-returns">warranty & returns</Link> for what&apos;s covered.
        </p>
      </section>
    </PolicyPage>
  );
}
