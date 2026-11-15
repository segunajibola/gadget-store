"use client";

/**
 * Add/remove key-value spec rows (e.g. RAM → 16GB). The rows are kept in
 * React state and serialised into one hidden <input name="specs"> as JSON,
 * so the surrounding form submits them like any other field.
 */
import { useState } from "react";
import { btnSecondary, inputCls } from "@/components/ui/styles";

type Spec = { label: string; value: string };

const SUGGESTIONS = ["Processor", "RAM", "Storage", "Screen", "Graphics", "Battery", "OS"];

export function SpecsEditor({ initial }: { initial: Spec[] }) {
  const [rows, setRows] = useState<Spec[]>(initial.length ? initial : [{ label: "", value: "" }]);

  const update = (i: number, patch: Partial<Spec>) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  const filled = rows.filter((r) => r.label.trim() && r.value.trim());

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-gray-700">Specs</span>
      <input type="hidden" name="specs" value={JSON.stringify(filled)} />
      <datalist id="spec-labels">
        {SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          <input
            list="spec-labels"
            placeholder="Label (e.g. RAM)"
            value={row.label}
            onChange={(e) => update(i, { label: e.target.value })}
            className={`${inputCls} w-2/5`}
          />
          <input
            placeholder="Value (e.g. 16GB DDR4)"
            value={row.value}
            onChange={(e) => update(i, { value: e.target.value })}
            className={inputCls}
          />
          <button
            type="button"
            aria-label="Remove spec"
            onClick={() => setRows((r) => r.filter((_, j) => j !== i))}
            className="px-2 text-gray-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        className={btnSecondary}
        onClick={() => setRows((r) => [...r, { label: "", value: "" }])}
      >
        + Add spec
      </button>
    </div>
  );
}
