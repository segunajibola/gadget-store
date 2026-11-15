import { Star } from "lucide-react";

/** Read-only star rating, e.g. <Stars rating={4.6} />. Brand blue (amber is reserved for deals). */
export function Stars({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={`${size} ${n <= rounded ? "fill-brand-600 text-brand-600" : "fill-slate-200 text-slate-200"}`}
        />
      ))}
    </span>
  );
}
