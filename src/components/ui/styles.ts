// Shared Tailwind class strings for things that aren't components.
// Buttons → components/ui/Button.tsx, badges → components/ui/Badge.tsx.

export const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm " +
  "placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 " +
  "disabled:bg-slate-50 disabled:text-slate-500";

export const cardCls = "rounded-lg border border-slate-200 bg-white p-4 shadow-sm";

export const linkCls = "text-brand-600 hover:text-brand-700 hover:underline";

// Admin data tables
export const tableWrapCls = "overflow-x-auto rounded-lg border border-slate-200 bg-white";
export const tableCls = "w-full text-left text-sm";
export const theadCls = "bg-slate-50 text-slate-500";
export const tbodyCls = "divide-y divide-slate-100";
