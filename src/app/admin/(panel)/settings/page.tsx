import type { Metadata } from "next";
import { adminDb } from "@/lib/auth";
import { koboToNaira } from "@/lib/money";
import { formatNgPhone } from "@/lib/phone";
import { ActionForm } from "@/components/admin/ActionForm";
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
            <input
              name="pod_max_order_value"
              inputMode="decimal"
              required
              defaultValue={koboToNaira(s.pod_max_order_value)}
              className={inputCls}
            />
          </Field>
        </ActionForm>
      </div>
    </>
  );
}
