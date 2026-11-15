// DRAFT — review and adjust to your actual policy before launch.
import type { Metadata } from "next";
import { formatNgPhone, waLink } from "@/lib/phone";
import { getSettings } from "@/lib/store";
import { PolicyPage } from "@/components/store/PolicyPage";

export const metadata: Metadata = {
  title: "Warranty & returns",
  description: "Our warranty, inspection and returns policy for laptops and IT gadgets delivered in Lagos.",
};
export const revalidate = 3600;

export default async function WarrantyPage() {
  const s = await getSettings();
  const wa = waLink(s.whatsappNumber, `Hi ${s.storeName}, I'd like help with a warranty/return. My order number is: `);

  return (
    <PolicyPage
      title="Warranty & returns"
      updated="November 2026"
      intro="We want you to enjoy your work with every gadget you buy from us. Here's exactly what's covered and how to get help if something isn't right."
    >
      <section>
        <h2>1. Check your item on delivery</h2>
        <p>
          Please inspect your item when the rider arrives: switch it on, check the screen, keyboard, ports and charger,
          and make sure it matches the description on our site. If you pay on delivery, you can do this before paying.
          If anything is wrong, tell the rider and contact us immediately.
        </p>
      </section>

      <section>
        <h2>2. 7-day faulty or &ldquo;not as described&rdquo; guarantee</h2>
        <p>If your item develops a fault or isn&apos;t as described within <strong>7 days of delivery</strong>, we will:</p>
        <ul>
          <li>replace it with the same or an equivalent item, or</li>
          <li>repair it at no cost, or</li>
          <li>give you a full refund if we can&apos;t replace or repair it.</li>
        </ul>
        <p>We arrange pickup at no cost to you for faulty or wrong items.</p>
      </section>

      <section>
        <h2>3. Warranty period</h2>
        <p>
          Every product page shows its warranty. As a guide: <strong>new</strong> items come with the manufacturer&apos;s
          warranty where available; <strong>UK-used</strong> and <strong>refurbished</strong> items come with the vendor
          warranty stated on the listing. During the warranty period we handle the claim with the vendor for you.
        </p>
      </section>

      <section>
        <h2>4. What&apos;s not covered</h2>
        <ul>
          <li>Physical damage, cracked screens or liquid damage after delivery</li>
          <li>Software problems, viruses, or issues from installing a different operating system</li>
          <li>Normal battery wear on UK-used and refurbished laptops (the battery must hold a charge on delivery)</li>
          <li>Items with removed or tampered warranty stickers, or repaired by someone else</li>
          <li>Accessories and chargers reported more than 7 days after delivery</li>
        </ul>
      </section>

      <section>
        <h2>5. Change of mind</h2>
        <p>
          We can accept change-of-mind returns only for <strong>new, unopened</strong> items reported within{" "}
          <strong>48 hours</strong> of delivery. The item must be in its original packaging, and the delivery and
          pickup fees are not refundable.
        </p>
      </section>

      <section>
        <h2>6. Refunds</h2>
        <ul>
          <li>Paid online (Paystack): refunded to your original payment method, usually within 5–10 working days.</li>
          <li>Paid on delivery: refunded by bank transfer within 3 working days of us receiving the item back.</li>
        </ul>
      </section>

      <section>
        <h2>7. How to make a claim</h2>
        <p>
          Message us on <a href={wa} target="_blank" rel="noopener noreferrer">WhatsApp ({formatNgPhone(s.whatsappNumber)})</a>{" "}
          with your order number and a short video or photos of the problem. We aim to respond within one working day.
        </p>
      </section>
    </PolicyPage>
  );
}
