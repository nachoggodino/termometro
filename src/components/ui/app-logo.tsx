export function AppLogo() {
  return (
    <div className="relative flex size-9 items-center justify-center" aria-hidden="true">
      <div className="absolute h-7 w-7 rotate-45 rounded-[var(--logo-diamond-radius)] bg-[var(--metro-red)]" />
      <div className="relative h-7 w-2 rounded-full bg-[var(--metro-blue)]">
        <div className="absolute -bottom-1 left-1/2 size-4 -translate-x-1/2 rounded-full border-2 border-background bg-[var(--metro-blue)]" />
        <div className="absolute left-1/2 top-1 h-3 w-[var(--logo-highlight-width)] -translate-x-1/2 rounded-full bg-background/75" />
      </div>
    </div>
  );
}
