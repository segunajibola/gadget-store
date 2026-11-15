"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminDb } from "@/lib/auth";
import { REVIEW_PHOTOS_BUCKET } from "@/lib/images";

type Result = { ok: true; message?: string } | { ok: false; error: string };

function refresh() {
  revalidatePath("/admin/reviews");
  revalidatePath("/", "layout"); // home page shows approved reviews
}

export async function setReviewStatus(id: string, status: "approved" | "rejected" | "pending"): Promise<Result> {
  const db = await adminDb();
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Invalid review" };
  const { error } = await db.from("reviews").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, message: status === "approved" ? "Approved — now live on the site." : `Marked ${status}.` };
}

export async function deleteReview(id: string): Promise<Result> {
  const db = await adminDb();
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Invalid review" };
  const { data } = await db.from("reviews").select("photo_path").eq("id", id).maybeSingle();
  if (data?.photo_path) await db.storage.from(REVIEW_PHOTOS_BUCKET).remove([data.photo_path]);
  const { error } = await db.from("reviews").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, message: "Deleted." };
}
