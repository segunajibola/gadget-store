import { MoneyInput } from "@/components/admin/MoneyInput";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/auth";
import { koboToNaira } from "@/lib/money";
import { ActionForm } from "@/components/admin/ActionForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { PageHeader } from "@/components/admin/PageHeader";
import { Checkbox, Field } from "@/components/ui/Field";
import { cardCls, inputCls } from "@/components/ui/styles";
import { deleteZone, saveZone } from "../actions";

export default async function ZonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const db = await adminDb();

  const zone = isNew ? null : (await db.from("zones").select("*").eq("id", id).maybeSingle()).data;
  if (!isNew && !zone) notFound();

  return (
    <>
      <PageHeader
        title={isNew ? "New zone" : zone!.name}
        back={{ href: "/admin/zones", label: "Zones" }}
      >
        {zone && (
          <DeleteButton
            id={zone.id}
            action={deleteZone}
            confirmText="Delete this zone? Past orders keep the zone name. Consider hiding it instead."
          />
        )}
      </PageHeader>

      <div className={`${cardCls} max-w-xl`}>
        <ActionForm action={saveZone}>
          {zone && <input type="hidden" name="id" value={zone.id} />}
          <Field label="Zone name" hint="Shown to customers at checkout">
            <input name="name" required defaultValue={zone?.name} className={inputCls} />
          </Field>
          <Field label="Areas covered" hint="Comma-separated, e.g. Yaba, Surulere, Gbagada">
            <textarea name="areas" rows={2} defaultValue={zone?.areas ?? ""} className={inputCls} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Customer fee (₦)">
              <MoneyInput name="delivery_fee" required defaultValue={zone ? koboToNaira(zone.delivery_fee) : ""} />
            </Field>
            <Field label="Rider cost (₦)">
              <MoneyInput name="default_rider_cost" required defaultValue={zone ? koboToNaira(zone.default_rider_cost) : ""} />
            </Field>
            <Field label="Approx. km from hub">
              <input
                name="approx_distance_km"
                inputMode="decimal"
                defaultValue={zone?.approx_distance_km ?? ""}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Sort order" hint="Lower numbers appear first at checkout">
            <input
              name="sort_order"
              type="number"
              defaultValue={zone?.sort_order ?? 0}
              className={`${inputCls} max-w-32`}
            />
          </Field>
          <Checkbox name="is_active" label="Active (shown at checkout)" defaultChecked={zone?.is_active ?? true} />
        </ActionForm>
      </div>
    </>
  );
}
