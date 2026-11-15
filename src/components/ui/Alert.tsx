import type { ReactNode } from "react";

/** Inline message box for form results and notices. */
const tones = {
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-700",
  info: "bg-brand-50 text-brand-800",
} as const;

export function Alert({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return (
    <p
      className={`rounded-md px-3 py-2 text-sm ${tones[tone]}`}
      role={tone === "danger" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}
