"use client";

/**
 * Naira input with a live preview ("= ₦300,000") or an error if the format
 * is wrong. Submits the raw text; the server re-validates with nairaToKobo().
 */
import { useState } from "react";
import { formatNaira, nairaToKobo } from "@/lib/money";
import { inputCls } from "@/components/ui/styles";

export function MoneyInput({
  name,
  defaultValue,
  required,
}: {
  name: string;
  defaultValue?: string | number;
  required?: boolean;
}) {
  const [value, setValue] = useState(defaultValue === undefined ? "" : String(defaultValue));
  const kobo = value.trim() ? nairaToKobo(value) : null;
  const invalid = value.trim() !== "" && kobo === null;

  return (
    <>
      <input
        name={name}
        inputMode="decimal"
        required={required}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-invalid={invalid}
        className={`${inputCls} ${invalid ? "border-danger focus:border-danger focus:ring-danger/40" : ""}`}
      />
      <span className={`block text-xs ${invalid ? "text-danger-700" : "text-slate-500"}`} aria-live="polite">
        {invalid ? "Invalid amount — e.g. 300000 or 300,000" : kobo !== null ? `= ${formatNaira(kobo)}` : " "}
      </span>
    </>
  );
}
