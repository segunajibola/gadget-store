import Image from "next/image";
import { BadgeCheck, Quote } from "lucide-react";
import type { Review } from "@/lib/store";
import { Badge } from "@/components/ui/Badge";
import { Stars } from "@/components/store/Stars";

/** Approved customer reviews. Hidden entirely when there are none. */
export function Reviews({ reviews, average, count }: { reviews: Review[]; average: number; count: number }) {
  if (reviews.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="reviews-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="reviews-heading" className="text-2xl font-bold">
            What our customers say
          </h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-700">
            <Stars rating={average} />
            <span>
              <strong className="text-slate-900">{average.toFixed(1)}</strong> out of 5 · {count} review{count === 1 ? "" : "s"}
            </span>
          </p>
        </div>
      </div>
      <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r) => (
          <li key={r.id} className="flex flex-col rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <Stars rating={r.rating} />
              {r.isSample ? (
                <Badge tone="neutral">Sample</Badge>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-success-700">
                  <BadgeCheck className="h-4 w-4" aria-hidden="true" /> Verified purchase
                </span>
              )}
            </div>
            <Quote className="mt-3 h-5 w-5 text-brand-200" aria-hidden="true" />
            <p className="mt-1 flex-1 text-slate-700">{r.comment}</p>
            {r.photoUrl && (
              <div className="relative mt-3 aspect-video overflow-hidden rounded-md bg-slate-100">
                <Image src={r.photoUrl} alt={`Photo from ${r.customerName}`} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
              </div>
            )}
            <p className="mt-4 text-sm">
              <span className="font-semibold text-slate-900">{r.customerName}</span>
              {r.area && <span className="text-slate-500"> · {r.area}</span>}
            </p>
            {r.products && <p className="text-xs text-slate-500">Bought: {r.products}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
