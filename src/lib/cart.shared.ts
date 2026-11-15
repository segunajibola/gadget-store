// Cart constants used by BOTH the browser cart (lib/cart.ts, "use client")
// and server code (checkout). Server code can't import values from a
// "use client" module, so shared values live here.
export const MAX_QTY = 10;
