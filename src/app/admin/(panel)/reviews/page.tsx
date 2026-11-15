import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { adminDb } from "@/lib/auth";
import { formatLagosDateTime } from "@/lib/dates";
import { reviewPhotoUrl } from "@/lib/images";
import { ActionButton } from "@/components/admin/ActionButton";
import { EmptyState, PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { cardCls, linkCls } from "@/components/ui/styles";
import { Stars } from "@/components/store/Stars";
import { deleteReview, setReviewStatus } from "./actions";

export const metadata: Metadata = { title: "Reviews" };

const TABS = { pending: "Waiting for approval", approved: "Live on site", rejected: "Rejected" } as const;
type Tab = keyof typeof TABS;

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: t } = await searchParams;
  const tab: Tab = t && t in TABS ? (t as Tab) : "pending";
  const db = await adminDb();
  const { data: reviews, error } = await db
    .from("reviews")
    .select("id, created_at, order_id, customer_name, area, products, rating, comment, photo_path, status, is_sample, orders(order_number)")
    .eq("status", tab)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (
    <>
      <PageHeader title="Reviews" />
      <p className="-mt-4 mb-4 text-sm text-slate-500">
        Customers get a review link in the &ldquo;Update customer&rdquo; WhatsApp message once an order is delivered.
        Reviews appear on the home page only after you approve them.
      </p>

      <nav aria-label="Review filters" className="mb-4 flex flex-wrap gap-2">
        {(Object.entries(TABS) as [Tab, string][]).map(([key, label]) => (
          <Link
            key={key}
            href={`/admin/reviews?tab=${key}`}
            aria-current={tab === key ? "page" : undefined}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              tab === key ? "border-brand-200 bg-brand-100 font-medium text-brand-800" : "border-slate-200 bg-white text-slate-700 hover:border-brand-300"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {reviews.length === 0 ? (
        <EmptyState>No reviews here.</EmptyState>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className={`${cardCls} flex flex-col gap-4 sm:flex-row`}>
              {r.photo_path && (
                <a href={reviewPhotoUrl(r.photo_path)} target="_blank" rel="noopener noreferrer" className="relative h-28 w-28 shrink-0 overflow-hidden rounded-md bg-slate-100">
                  <Image src={reviewPhotoUrl(r.photo_path)} alt="Customer photo" fill sizes="112px" className="object-cover" />
                </a>
              )}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars rating={r.rating} />
                  <span className="font-medium text-slate-900">{r.customer_name}</span>
                  {r.area && <span className="text-sm text-slate-500">· {r.area}</span>}
                  {r.is_sample && <Badge tone="warning">Sample — delete before launch</Badge>}
                </div>
                <p className="text-slate-700">{r.comment}</p>
                <p className="text-xs text-slate-500">
                  {r.products && <>Bought: {r.products} · </>}
                  {formatLagosDateTime(r.created_at)}
                  {r.order_id && r.orders && (
                    <>
                      {" "}·{" "}
                      <Link href={`/admin/orders/${r.order_id}`} className={linkCls}>{r.orders.order_number}</Link>
                    </>
                  )}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {r.status !== "approved" && (
                    <ActionButton action={setReviewStatus.bind(null, r.id, "approved")} label="Approve" variant="primary" />
                  )}
                  {r.status !== "rejected" && (
                    <ActionButton action={setReviewStatus.bind(null, r.id, "rejected")} label={r.status === "approved" ? "Hide from site" : "Reject"} />
                  )}
                  <ActionButton
                    action={deleteReview.bind(null, r.id)}
                    label="Delete"
                    variant="ghost"
                    confirmText="Delete this review permanently?"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
