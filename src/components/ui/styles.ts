// Shared Tailwind class strings so forms/buttons look consistent.
export const inputCls =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-gray-100";

export const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";
export const btnPrimary = `${btnBase} bg-blue-600 text-white hover:bg-blue-700`;
export const btnSecondary = `${btnBase} border border-gray-300 bg-white text-gray-800 hover:bg-gray-50`;
export const btnDanger = `${btnBase} bg-red-600 text-white hover:bg-red-700`;

export const cardCls = "rounded-lg border border-gray-200 bg-white p-4 shadow-sm";
