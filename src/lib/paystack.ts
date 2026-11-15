/**
 * Paystack API helpers — SERVER ONLY (uses the secret key).
 * Docs: https://paystack.com/docs/api/transaction/
 *
 * Amounts are in kobo, same as our database, so no conversion is needed.
 */
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env.server";

const API = "https://api.paystack.co";

type PaystackResponse<T> = { status: boolean; message: string; data: T };

async function paystack<T>(path: string, init?: RequestInit): Promise<T> {
  const request = () =>
    fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${serverEnv.paystackSecretKey}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store", // never cache payment API calls
      signal: AbortSignal.timeout(15_000),
    });

  // Retry once on a network failure (DNS hiccup, timeout). HTTP errors
  // (4xx/5xx) are real answers from Paystack and are not retried.
  let res: Response;
  try {
    res = await request();
  } catch {
    await new Promise((r) => setTimeout(r, 1000));
    res = await request();
  }
  const body = (await res.json()) as PaystackResponse<T>;
  if (!res.ok || !body.status) {
    throw new Error(`Paystack ${path} failed: ${body.message ?? res.statusText}`);
  }
  return body.data;
}

/** Start a payment. Returns the Paystack-hosted page to send the customer to. */
export function initializeTransaction(input: {
  email: string;
  amount: number; // kobo
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}) {
  return paystack<{ authorization_url: string; access_code: string; reference: string }>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        amount: input.amount,
        currency: "NGN",
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: input.metadata,
      }),
    },
  );
}

export type VerifiedTransaction = {
  status: "success" | "failed" | "abandoned" | "ongoing" | "pending" | "reversed" | string;
  reference: string;
  amount: number; // kobo
  currency: string;
  fees: number | null; // kobo — Paystack's charge, used for profit
  paid_at: string | null;
  metadata: { order_id?: string; order_number?: string } | null;
};

/** Ask Paystack for the true state of a transaction (never trust the browser). */
export function verifyTransaction(reference: string) {
  return paystack<VerifiedTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/**
 * Webhook authenticity check: Paystack signs the raw request body with
 * HMAC-SHA512 using our secret key and sends it in `x-paystack-signature`.
 */
export function isValidWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", serverEnv.paystackSecretKey).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b); // constant-time compare
}

/** Unique per attempt — Paystack rejects re-used references. */
export function newReference(orderNumber: string): string {
  return `${orderNumber}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
