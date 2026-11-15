import { Check, ClipboardCheck, PackageCheck, Truck, XCircle, type LucideIcon } from "lucide-react";
import type { OrderStatus } from "@/lib/constants";

/**
 * Customer-friendly progress: 4 steps instead of the 6 internal statuses.
 *   new → Order placed · vendor_confirmed → Confirmed ·
 *   rider_assigned / picked_up → On the way · delivered / completed → Delivered
 */
const STEPS: { label: string; icon: LucideIcon; reached: OrderStatus[] }[] = [
  { label: "Order placed", icon: ClipboardCheck, reached: ["new", "vendor_confirmed", "rider_assigned", "picked_up", "delivered", "completed"] },
  { label: "Confirmed", icon: PackageCheck, reached: ["vendor_confirmed", "rider_assigned", "picked_up", "delivered", "completed"] },
  { label: "On the way", icon: Truck, reached: ["rider_assigned", "picked_up", "delivered", "completed"] },
  { label: "Delivered", icon: Check, reached: ["delivered", "completed"] },
];

export function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "cancelled" || status === "returned") {
    return (
      <p className="flex items-center justify-center gap-2 rounded-lg bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
        <XCircle className="h-5 w-5" aria-hidden="true" />
        This order was {status === "cancelled" ? "cancelled" : "returned"}.
      </p>
    );
  }

  const current = STEPS.filter((s) => s.reached.includes(status)).length - 1;

  return (
    <ol className="grid grid-cols-4 gap-1" aria-label="Order progress">
      {STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step.label} className="relative flex flex-col items-center text-center" aria-current={i === current ? "step" : undefined}>
            {/* connector line to the next step */}
            {i < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute left-1/2 top-5 h-0.5 w-full ${i < current ? "bg-brand-600" : "bg-slate-200"}`}
              />
            )}
            <span
              className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${
                done ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400"
              }`}
            >
              <step.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className={`mt-2 text-xs sm:text-sm ${done ? "font-medium text-slate-900" : "text-slate-500"}`}>
              {step.label}
              <span className="sr-only">{done ? " (done)" : " (not yet)"}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
