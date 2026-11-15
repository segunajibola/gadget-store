import { MoneyInput } from "@/components/admin/MoneyInput";
import type { Metadata } from "next";
import { adminDb } from "@/lib/auth";
import { koboToNairaInput } from "@/lib/money";
import { formatNgPhone } from "@/lib/phone";
import { placeholderFields } from "@/lib/placeholders";
import { ActionForm } from "@/components/admin/ActionForm";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/admin/PageHeader";
import { Field } from "@/components/ui/Field";
import { cardCls, inputCls } from "@/components/ui/styles";
import { saveSettings } from "./actions";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const db = await adminDb();
  const { data: s, error } = await db.from("settings").select("*").eq("id", true).single();
  if (error) throw error;

  return (
    <>
      <PageHeader title="Settings" />
      {placeholderFields(s).length > 0 && (
        <div className="mb-4 max-w-xl">
          <Alert tone="warning">
            Replace the placeholder {placeholderFields(s).join(", ")} before launch — they&apos;re shown publicly on the
            site.
          </Alert>
        </div>
      )}
      <div className={`${cardCls} max-w-xl`}>
        <ActionForm action={saveSettings} submitLabel="Save settings">
          <Field label="Store name">
            <input name="store_name" required defaultValue={s.store_name} className={inputCls} />
          </Field>
          <Field label="WhatsApp number" hint="Customers chat with this number">
            <input
              name="whatsapp_number"
              type="tel"
              required
              defaultValue={formatNgPhone(s.whatsapp_number)}
              className={inputCls}
            />
          </Field>
          <Field label="Support email (optional)">
            <input
              name="support_email"
              type="email"
              defaultValue={s.support_email ?? ""}
              className={inputCls}
            />
          </Field>
          <Field label="Pickup hub address" hint="Used in rider pickup messages">
            <input name="hub_address" required defaultValue={s.hub_address} className={inputCls} />
          </Field>
          <Field
            label="Pay-on-delivery limit (₦)"
            hint="Orders above this total must pay online with Paystack"
          >
            <MoneyInput name="pod_max_order_value" required defaultValue={koboToNairaInput(s.pod_max_order_value)} />
          </Field>
          <Field
            label="Free consultation booking link (Calendly)"
            hint="e.g. https://calendly.com/your-name/laptop-consultation — leave blank to hide the 'Book a call' buttons"
          >
            <input
              name="calendly_url"
              type="url"
              placeholder="https://calendly.com/…"
              defaultValue={s.calendly_url ?? ""}
              className={inputCls}
            />
          </Field>

          <h2 className="border-t border-slate-200 pt-4 font-semibold">Business details (shown on the site)</h2>
          <Field label="CAC registration number" hint="e.g. RC 1234567 or BN 1234567 — builds trust with buyers">
            <input name="cac_number" defaultValue={s.cac_number ?? ""} className={inputCls} />
          </Field>
          <Field label="Business address">
            <input name="business_address" defaultValue={s.business_address ?? ""} className={inputCls} />
          </Field>
          <Field label="Opening hours" hint="e.g. Mon–Sat, 9am–6pm">
            <input name="business_hours" defaultValue={s.business_hours ?? ""} className={inputCls} />
          </Field>
          <Field label="Instagram handle" hint="e.g. @yourstore — leave blank to hide">
            <input
              name="instagram_handle"
              defaultValue={s.instagram_handle ? `@${s.instagram_handle}` : ""}
              className={inputCls}
            />
          </Field>
          <Field
            label="WhatsApp Channel link (optional)"
            hint="If you create a WhatsApp Channel for deals. Blank = customers message your number to join updates."
          >
            <input
              name="whatsapp_channel_url"
              type="url"
              placeholder="https://whatsapp.com/channel/…"
              defaultValue={s.whatsapp_channel_url ?? ""}
              className={inputCls}
            />
          </Field>
        </ActionForm>
      </div>
    </>
  );
}
