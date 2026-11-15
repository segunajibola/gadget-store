import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { ActionForm } from "@/components/admin/ActionForm";
import { Field } from "@/components/ui/Field";
import { cardCls, inputCls } from "@/components/ui/styles";
import { trackOrder } from "./actions";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the status of your order with your order number and phone number.",
};

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="mb-6 flex flex-col items-center text-center">
        <PackageSearch className="h-12 w-12 text-brand-600" aria-hidden="true" />
        <h1 className="mt-3 text-2xl font-bold md:text-3xl">Track your order</h1>
        <p className="mt-2 text-slate-700">
          Enter your order number (e.g. ORD-10003) and the phone number you used at checkout.
        </p>
      </div>
      <div className={cardCls}>
        <ActionForm action={trackOrder} submitLabel="Track order">
          <Field label="Order number">
            <input
              name="orderNumber"
              required
              autoComplete="off"
              placeholder="ORD-10003"
              className={`${inputCls} uppercase`}
            />
          </Field>
          <Field label="Phone number">
            <input name="phone" type="tel" required autoComplete="tel" placeholder="0801 234 5678" className={inputCls} />
          </Field>
        </ActionForm>
      </div>
    </div>
  );
}
