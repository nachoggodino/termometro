export default function ExploreLoading() {
  return (
    <main className="min-h-dvh bg-[image:radial-gradient(circle_at_50%_-10%,var(--page-glow),transparent_32rem)]">
      <div className="mx-auto max-w-5xl px-4 pb-5">
        <div className="sticky top-[80px] z-20 -mx-4 border-b border-border bg-[var(--nav-surface)] px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="h-3 w-24 animate-pulse rounded-sm bg-surface" />
              <div className="mt-2 h-4 w-32 animate-pulse rounded-sm bg-surface" />
            </div>
            <div className="h-10 w-24 animate-pulse rounded-md bg-surface" />
          </div>
        </div>
        <section className="py-6">
          <div className="h-8 w-36 animate-pulse rounded-sm bg-surface" />
          <div className="mt-3 h-4 max-w-2xl animate-pulse rounded-sm bg-surface" />
        </section>
        <div className="grid gap-4 lg:grid-cols-[1fr_0.82fr]">
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }, (_, index) => (
              <section className="rounded-md border border-border bg-surface-raised p-4" key={index}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="h-5 w-40 animate-pulse rounded-sm bg-surface" />
                    <div className="mt-2 h-3 w-20 animate-pulse rounded-sm bg-surface" />
                  </div>
                  <div className="size-9 animate-pulse rounded-md bg-surface" />
                </div>
                <div className="h-56 animate-pulse rounded-md bg-surface" />
                <div className="mt-4 h-4 w-2/3 animate-pulse rounded-sm bg-surface" />
              </section>
            ))}
          </div>
          <aside className="flex flex-col gap-4">
            {Array.from({ length: 2 }, (_, index) => (
              <section className="rounded-md border border-border bg-surface-raised p-4" key={index}>
                <div className="h-5 w-36 animate-pulse rounded-sm bg-surface" />
                <div className="mt-4 flex flex-col gap-3">
                  {Array.from({ length: 5 }, (_, row) => (
                    <div className="h-12 animate-pulse rounded-sm bg-surface" key={row} />
                  ))}
                </div>
              </section>
            ))}
          </aside>
        </div>
        <section className="grid gap-3 pt-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div className="rounded-md border border-border bg-surface-raised p-4" key={index}>
              <div className="flex items-center justify-between">
                <div className="h-8 w-10 animate-pulse rounded-sm bg-surface" />
                <div className="h-8 w-12 animate-pulse rounded-sm bg-surface" />
              </div>
              <div className="mt-4 h-4 w-32 animate-pulse rounded-sm bg-surface" />
              <div className="mt-4 grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }, (_, item) => (
                  <div className="h-10 animate-pulse rounded-sm bg-surface" key={item} />
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
