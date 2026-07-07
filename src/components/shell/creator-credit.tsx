import Image from "next/image";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const CREATOR_HREF = "https://github.com/nachoggodino";
const CREATOR_LOGO_SRC = "/creator-credit-logo.svg";

export function CreatorCredit({ dictionary }: { dictionary: Dictionary }) {
  const credit = dictionary.common.creatorCredit;

  return (
    <footer className="px-[var(--space-lg)] pb-[var(--space-xl)] pt-[var(--space-lg)]">
      <a
        aria-label={credit.ariaLabel}
        className="mx-auto flex w-fit max-w-full items-center gap-[var(--space-xs)] rounded-md border border-border bg-surface-raised px-[var(--space-sm)] py-[var(--space-xs)] text-sm font-medium leading-tight text-muted no-underline transition duration-[var(--duration-base)] ease-out hover:border-primary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        href={CREATOR_HREF}
        rel="noreferrer"
        target="_blank"
      >
        <Image aria-hidden="true" alt="" className="size-5 shrink-0" height={20} src={CREATOR_LOGO_SRC} width={20} />
        <span>{credit.prefix}</span>
        <span className="font-semibold text-foreground">{credit.name}</span>
      </a>
    </footer>
  );
}
