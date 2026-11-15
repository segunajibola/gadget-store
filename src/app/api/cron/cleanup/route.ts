/**
 * GET /api/cron/cleanup — runs once a day on Vercel (see vercel.json).
 *
 *  1. Cancels online (Paystack) orders still unpaid after 24 hours — each one
 *     is re-checked with Paystack first, so a paid order is never cancelled.
 *  2. Deletes old rate-limit records.
 *
 * Security: Vercel Cron sends "Authorization: Bearer <CRON_SECRET>". Anyone
 * else calling this URL gets 401.
 */
import { NextResponse } from "next/server";
import { cancelUnpaidOrder } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: stale } = await db
    .from("orders")
    .select("id")
    .eq("payment_method", "paystack")
    .eq("status", "new")
    .neq("payment_status", "paid")
    .lt("created_at", cutoff)
    .limit(50);

  let cancelled = 0;
  let paidAfterAll = 0;
  for (const o of stale ?? []) {
    const res = await cancelUnpaidOrder(o.id, "Auto-cancelled: not paid within 24 hours");
    if (res.ok) cancelled++;
    else if (res.paid) paidAfterAll++;
  }

  // Rate-limit hits older than a day are useless.
  await db.from("rate_limit_hits").delete().lt("created_at", cutoff);

  return NextResponse.json({ checked: stale?.length ?? 0, cancelled, paidAfterAll });
}
