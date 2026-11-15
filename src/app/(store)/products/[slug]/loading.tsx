export default function ProductLoading() {
  const pulse = "animate-pulse rounded bg-slate-200 motion-reduce:animate-none";
  return (
    <div className="mx-auto max-w-6xl px-4 py-6" aria-busy="true" aria-label="Loading product">
      <div className={`h-4 w-56 ${pulse}`} />
      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none" />
        <div className="space-y-4">
          <div className={`h-6 w-32 ${pulse}`} />
          <div className={`h-9 w-4/5 ${pulse}`} />
          <div className={`h-9 w-40 ${pulse}`} />
          <div className={`h-12 w-full max-w-xs ${pulse}`} />
          <div className={`h-28 w-full ${pulse}`} />
        </div>
      </div>
    </div>
  );
}
