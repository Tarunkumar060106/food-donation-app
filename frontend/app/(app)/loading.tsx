/** Shown while a signed-in page's data loads. Mirrors the common header + tiles + list shape. */
export default function Loading() {
  return (
    <div className="grid gap-10" aria-busy="true" aria-label="Loading">
      <div className="grid gap-3">
        <div className="h-10 w-full max-w-72 animate-pulse rounded-[10px] bg-sage" />
        <div className="h-5 w-full max-w-96 animate-pulse rounded-[10px] bg-sage/70" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-sage" />
        ))}
      </div>
      <div className="grid gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-sage/70" />
        ))}
      </div>
    </div>
  );
}
