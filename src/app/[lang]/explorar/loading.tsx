export default function ExploreLoading() {
  return (
    <main className="min-h-dvh">
      <div className="sticky top-0 z-[var(--z-sticky)] px-4 pt-4">
        <div className="mx-auto max-w-5xl rounded-lg border border-border bg-[var(--nav-surface)] px-3 py-2 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-md bg-surface" />
            <div className="h-4 w-44 rounded-sm bg-surface" />
            <div className="ml-auto size-10 rounded-md bg-surface" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 pb-10">
        <div className="sticky top-[65px] z-20 -mx-4 border-b border-border bg-background/96 px-4 py-3 backdrop-blur">
          <div className="flex gap-2 overflow-hidden pb-2">
            {Array.from({ length: 8 }, (_, index) => (
              <div className="h-9 w-14 shrink-0 animate-pulse rounded-md bg-surface" key={index} />
            ))}
          </div>
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="h-9 w-24 shrink-0 animate-pulse rounded-md bg-surface" key={index} />
            ))}
          </div>
        </div>
        <section className="py-6">
          <div className="h-8 w-36 animate-pulse rounded-sm bg-surface" />
          <div className="mt-3 h-4 max-w-2xl animate-pulse rounded-sm bg-surface" />
        </section>
        <section className="grid gap-3 pb-4 sm:grid-cols-3">
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
      </div>
    </main>
  );
}
