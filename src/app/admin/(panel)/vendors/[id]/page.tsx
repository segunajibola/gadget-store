import { notFound } from "next/navigation";
import { adminDb } from "@/lib/auth";
import { formatNgPhone } from "@/lib/phone";
import { ActionForm } from "@/components/admin/ActionForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { PageHeader } from "@/components/admin/PageHeader";
import { Checkbox, Field } from "@/components/ui/Field";
import { cardCls, inputCls } from "@/components/ui/styles";
import { deleteVendor, saveVendor } from "../actions";

// [id] is a dynamic segment: /admin/vendors/new or /admin/vendors/<uuid>.
// `params` is a Promise in Next 15+.
export default async function VendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const db = await adminDb();

  const vendor = isNew
    ? null
    : (await db.from("vendors").select("*").eq("id", id).maybeSingle()).data;
  if (!isNew && !vendor) notFound();

  return (
    <>
      <PageHeader
        title={isNew ? "New vendor" : vendor!.name}
        back={{ href: "/admin/vendors", label: "Vendors" }}
      >
        {vendor && (
          <DeleteButton
            id={vendor.id}
            action={deleteVendor}
            confirmText="Delete this vendor? Products will keep existing but lose their vendor link. Consider marking inactive instead."
          />
        )}
      </PageHeader>

      <div className={`${cardCls} max-w-xl`}>
        <ActionForm action={saveVendor}>
          {vendor && <input type="hidden" name="id" value={vendor.id} />}
          <Field label="Name">
            <input name="name" required defaultValue={vendor?.name} className={inputCls} />
          </Field>
          <Field label="WhatsApp / phone" hint="e.g. 08012345678">
            <input
              name="phone"
              type="tel"
              defaultValue={vendor?.phone ? formatNgPhone(vendor.phone) : ""}
              className={inputCls}
            />
          </Field>
          <Field label="Address / shop location" hint="e.g. Shop 12, Computer Village, Ikeja">
            <input name="address" defaultValue={vendor?.address ?? ""} className={inputCls} />
          </Field>
          <Field label="Notes">
            <textarea name="notes" rows={3} defaultValue={vendor?.notes ?? ""} className={inputCls} />
          </Field>
          <Checkbox name="is_active" label="Active" defaultChecked={vendor?.is_active ?? true} />
        </ActionForm>
      </div>
    </>
  );
}
