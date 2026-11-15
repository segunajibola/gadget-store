"use client";

/**
 * Client-side cart persisted in localStorage.
 *
 * Implemented as a tiny "external store" read with React's
 * useSyncExternalStore — React's recommended way to subscribe to data that
 * lives outside React (like localStorage). It also handles server rendering:
 * on the server the cart is always empty, then the browser fills it in.
 *
 * Prices here are for DISPLAY only. Checkout recalculates every price on the
 * server from the database.
 */
import { useSyncExternalStore } from "react";
import { MAX_QTY } from "@/lib/cart.shared";

export { MAX_QTY };

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number; // kobo, last known
  image: string | null;
  qty: number;
};

const STORAGE_KEY = "gs_cart_v1";
const EMPTY: CartItem[] = [];

let cache: CartItem[] | null = null;
const listeners = new Set<() => void>();

function read(): CartItem[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function write(items: CartItem[]) {
  cache = items;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage full / private mode — cart still works for this tab
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep tabs in sync: another tab changed the cart.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const clampQty = (n: number) => Math.max(1, Math.min(MAX_QTY, Math.floor(n)));

export const cartActions = {
  add(item: Omit<CartItem, "qty">, qty = 1) {
    const items = read();
    const existing = items.find((i) => i.productId === item.productId);
    write(
      existing
        ? items.map((i) =>
            i.productId === item.productId ? { ...i, ...item, qty: clampQty(i.qty + qty) } : i,
          )
        : [...items, { ...item, qty: clampQty(qty) }],
    );
  },
  setQty(productId: string, qty: number) {
    write(read().map((i) => (i.productId === productId ? { ...i, qty: clampQty(qty) } : i)));
  },
  remove(productId: string) {
    write(read().filter((i) => i.productId !== productId));
  },
  clear() {
    write([]);
  },
  /** Update name/price/image from fresh server data (only writes if something changed). */
  refresh(fresh: Map<string, { name: string; price: number; slug: string; image: string | null }>) {
    let changed = false;
    const next = read().map((i) => {
      const f = fresh.get(i.productId);
      if (!f || (f.price === i.price && f.name === i.name && f.image === i.image && f.slug === i.slug)) return i;
      changed = true;
      return { ...i, ...f };
    });
    if (changed) write(next);
  },
};

/** The cart items (empty during server render / before hydration). */
export function useCart() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  return { items, count, subtotal };
}

// ---------- Pending (unpaid) online order -----------------------------------
// After checkout creates a Paystack order we keep the cart AND remember the
// order, so a customer who cancels on Paystack can come back and finish
// paying instead of losing their cart or placing a duplicate order.

export type PendingOrder = { id: string; orderNumber: string };
const PENDING_KEY = "gs_pending_order_v1";
let pendingCache: PendingOrder | null | undefined; // undefined = not read yet
const pendingListeners = new Set<() => void>();

function readPending(): PendingOrder | null {
  if (pendingCache !== undefined) return pendingCache;
  try {
    pendingCache = JSON.parse(localStorage.getItem(PENDING_KEY) ?? "null");
  } catch {
    pendingCache = null;
  }
  return pendingCache ?? null;
}

function writePending(value: PendingOrder | null) {
  pendingCache = value;
  try {
    if (value) localStorage.setItem(PENDING_KEY, JSON.stringify(value));
    else localStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore storage errors
  }
  pendingListeners.forEach((l) => l());
}

function subscribePending(listener: () => void) {
  pendingListeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === PENDING_KEY) {
      pendingCache = undefined;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    pendingListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export const pendingOrderActions = {
  set: (order: PendingOrder) => writePending(order),
  clear: () => writePending(null),
};

export function usePendingOrder(): PendingOrder | null {
  return useSyncExternalStore(subscribePending, readPending, () => null);
}

/** false on the server and during hydration, true once running in the browser. */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
const noopSubscribe = () => () => {};
