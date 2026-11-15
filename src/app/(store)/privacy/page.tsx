// DRAFT — not legal advice. Have it reviewed against the Nigeria Data Protection Act 2023 before launch.
import type { Metadata } from "next";
import { getSettings } from "@/lib/store";
import { PolicyPage } from "@/components/store/PolicyPage";

export const metadata: Metadata = { title: "Privacy policy" };
export const revalidate = 3600;

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <PolicyPage
      title="Privacy policy"
      updated="November 2026"
      intro={`This explains what personal information ${s.storeName} collects and how we use it, in line with the Nigeria Data Protection Act 2023.`}
    >
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Your name, phone number, email (optional) and delivery address when you place an order.</li>
          <li>Your requirements and contact details when you use our laptop finder.</li>
          <li>Reviews you choose to submit (shown publicly as first name, last initial and area).</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To confirm, deliver and support your order — including sharing your name, phone and address with the delivery rider.</li>
          <li>To contact you about your order or laptop finder request by phone or WhatsApp.</li>
          <li>We do not sell your information.</li>
        </ul>
      </section>
      <section>
        <h2>Service providers</h2>
        <ul>
          <li><strong>Paystack</strong> processes online payments. We never receive your card details.</li>
          <li><strong>Supabase</strong> hosts our database.</li>
          <li>
            Our laptop finder uses an AI service (<strong>Anthropic</strong>) to suggest laptops. Only your requirements
            (use, budget, preferences) are sent — never your name, phone number or email.
          </li>
        </ul>
      </section>
      <section>
        <h2>Your rights</h2>
        <p>
          You can ask us for a copy of your information, to correct it, or to delete it (unless we must keep it for legal
          or accounting reasons). Contact us on WhatsApp{s.supportEmail ? ` or ${s.supportEmail}` : ""}.
        </p>
      </section>
      <section>
        <h2>Cookies & storage</h2>
        <p>
          We store your cart in your browser so it&apos;s still there when you come back. To prevent abuse, we keep a
          short-lived, anonymised (hashed) record of form submissions for up to one day. We don&apos;t use advertising
          trackers.
        </p>
      </section>
    </PolicyPage>
  );
}
