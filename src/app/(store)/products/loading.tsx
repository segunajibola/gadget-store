/**
 * loading.tsx = what Next shows instantly while the page's data loads
 * (on slow mobile data this beats a blank screen).
 */
export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8" aria-busy="true" aria-label="Loading products">
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-slate-100 motion-reduce:animate-none" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-slate-200">
            <div className="aspect-square animate-pulse bg-slate-100 motion-reduce:animate-none" />
            <div className="space-y-2 p-3">
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
