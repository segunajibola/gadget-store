import { notFound } from "next/navigation";
import { adminDb } from "@/lib/auth";
import { formatNgPhone } from "@/lib/phone";
import { ActionForm } from "@/components/admin/ActionForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { PageHeader } from "@/components/admin/PageHeader";
import { Checkbox, Field } from "@/components/ui/Field";
import { cardCls, inputCls } from "@/components/ui/styles";
import { deleteRider, saveRider } from "../actions";

export default async function RiderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const db = await adminDb();

  const rider = isNew ? null : (await db.from("riders").select("*").eq("id", id).maybeSingle()).data;
  if (!isNew && !rider) notFound();

  return (
    <>
      <PageHeader
        title={isNew ? "New rider" : rider!.name}
        back={{ href: "/admin/riders", label: "Riders" }}
      >
        {rider && (
          <DeleteButton
            id={rider.id}
            action={deleteRider}
            confirmText="Delete this rider? Past orders keep their record but lose the rider link. Consider marking inactive instead."
          />
        )}
      </PageHeader>

      <div className={`${cardCls} max-w-xl`}>
        <ActionForm action={saveRider}>
          {rider && <input type="hidden" name="id" value={rider.id} />}
          <Field label="Name">
            <input name="name" required defaultValue={rider?.name} className={inputCls} />
          </Field>
          <Field label="WhatsApp / phone" hint="e.g. 08012345678">
            <input
              name="phone"
              type="tel"
              required
              defaultValue={rider ? formatNgPhone(rider.phone) : ""}
              className={inputCls}
            />
          </Field>
          <Field label="Notes" hint="e.g. bike, areas covered, usual rates">
            <textarea name="notes" rows={3} defaultValue={rider?.notes ?? ""} className={inputCls} />
          </Field>
          <Checkbox name="is_active" label="Active" defaultChecked={rider?.is_active ?? true} />
        </ActionForm>
      </div>
    </>
  );
}
