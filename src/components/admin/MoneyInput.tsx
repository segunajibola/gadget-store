"use client";

/**
 * Naira input with a live preview ("= ₦300,000") or an error if the format
 * is wrong. The server re-validates with nairaToKobo().
 *
 * Two ways to use it:
 *  - in a form (uncontrolled):  <MoneyInput name="price" defaultValue="300,000" />
 *  - controlled (React state):  <MoneyInput value={v} onChange={setV} />
 */
import { useState } from "react";
import { formatNaira, nairaToKobo } from "@/lib/money";
import { inputCls } from "@/components/ui/styles";

export function MoneyInput({
  name,
  defaultValue,
  value: controlled,
  onChange,
  required,
  ariaLabel,
}: {
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  ariaLabel?: string;
}) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const value = controlled ?? internal;
  const kobo = value.trim() ? nairaToKobo(value) : null;
  const invalid = (value.trim() !== "" || required === true) && kobo === null;

  return (
    <>
      <input
        name={name}
        inputMode="decimal"
        required={required}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => (onChange ? onChange(e.target.value) : setInternal(e.target.value))}
        aria-invalid={invalid}
        className={`${inputCls} ${invalid ? "border-danger focus:border-danger focus:ring-danger/40" : ""}`}
      />
      <span className={`block text-xs ${invalid ? "text-danger-700" : "text-slate-500"}`} aria-live="polite">
        {invalid
          ? value.trim()
            ? "Invalid amount — e.g. 300000 or 300,000"
            : "Required"
          : kobo !== null
            ? `= ${formatNaira(kobo)}`
            : " "}
      </span>
    </>
  );
}
