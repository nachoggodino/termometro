"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HeatReportCounts } from "@/components/report/heat-report-counts";
import { LineBadge } from "@/components/ui/line-badge";
import { InfoTooltip } from "@/components/ui/tooltip";
import { DASHBOARD_LIMITS, type DashboardData, type LineCarReportSummary, type LineSummary } from "@/lib/domain/dashboard";
import { LINE_COLORS, type MetroLine } from "@/lib/domain/lines";
import { formatCarCode } from "@/lib/domain/reports";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatNumber, formatRelativeReportAge } from "@/lib/i18n/format";

type FleetSummary = LineSummary & {
  fleetWithoutAcPercentage: number;
};

export function ExploreFleetPanel({
  data,
  dictionary,
  locale,
  rangeLabel,
  selectedLines,
}: {
  data: DashboardData;
  dictionary: Dictionary;
  locale: Locale;
  rangeLabel: string;
  selectedLines: MetroLine[];
}) {
  const visibleSummaries = data.lineSummaries.filter((summary) => (selectedLines.length > 0 ? selectedLines.includes(summary.line) : summary.reports > 0));
  const fleetSummaries = visibleSummaries
    .map((summary) => ({
      ...summary,
      fleetWithoutAcPercentage: Math.round((summary.carsWithoutAcReported / summary.estimatedCars) * 100),
    }))
    .toSorted((a, b) => b.fleetWithoutAcPercentage - a.fleetWithoutAcPercentage || b.reports - a.reports);

  return (
    <aside className="flex flex-col gap-4">
      <FleetCoverageSection dictionary={dictionary} locale={locale} rangeLabel={rangeLabel} summaries={fleetSummaries} />
    </aside>
  );
}

function FleetCoverageSection({
  dictionary,
  locale,
  rangeLabel,
  summaries,
}: {
  dictionary: Dictionary;
  locale: Locale;
  rangeLabel: string;
  summaries: FleetSummary[];
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleSummaries = summaries.slice(0, expanded ? summaries.length : DASHBOARD_LIMITS.fleetCollapsedCount);
  const canToggle = summaries.length > DASHBOARD_LIMITS.fleetCollapsedCount;

  return (
    <section className="scroll-mt-[13rem] rounded-md border border-border bg-surface-raised p-4" id="fleet">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold">{dictionary.explore.modules.fleet}</h2>
        <InfoTooltip label={dictionary.explore.modules.fleet}>{dictionary.explore.caveats.fleet}</InfoTooltip>
      </div>
      <p className="mt-1 text-xs font-semibold text-muted">
        {dictionary.explore.moduleRange}: {rangeLabel}
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {visibleSummaries.map((summary) => {
          const coverage = summary.fleetWithoutAcPercentage;
          return (
            <div key={summary.line}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <LineBadge line={summary.line} />
                <span className="text-right text-muted">
                  {coverage}% {dictionary.explore.fleetWithoutAc} ({formatNumber(summary.carsWithoutAcReported, locale)}/{formatNumber(summary.estimatedCars, locale)})
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, coverage)}%`, background: LINE_COLORS[summary.line].fill }} />
              </div>
            </div>
          );
        })}
      </div>
      {canToggle ? (
        <Button className="mt-4 min-h-10 w-full py-2" onClick={() => setExpanded((current) => !current)} type="button" variant="secondary">
          {expanded ? dictionary.explore.showLess : dictionary.explore.showMore}
          <ChevronDown aria-hidden="true" className={`size-4 transition duration-200 ease-out ${expanded ? "rotate-180" : ""}`} />
        </Button>
      ) : null}
    </section>
  );
}

export function LineDetailCards({
  data,
  cards,
  dictionary,
  selectedLines,
  locale,
}: {
  data: DashboardData;
  cards?: LineSummary[];
  dictionary: Dictionary;
  selectedLines: MetroLine[];
  locale: Locale;
}) {
  const [activeLine, setActiveLine] = useState<MetroLine | null>(null);
  const visibleSummaries = cards ?? data.lineSummaries.filter((summary) => (selectedLines.length > 0 ? selectedLines.includes(summary.line) : summary.reports > 0));
  const reportSummaryCards = visibleSummaries.toSorted((a, b) => b.reports - a.reports || b.score - a.score);
  const activeCars = activeLine ? data.lineCarReports.find((item) => item.line === activeLine) ?? null : null;

  return (
    <section className="scroll-mt-[13rem] pt-4" id="line-details">
      <h2 className="mb-3 text-base font-semibold">{dictionary.explore.modules.lineDetails}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {reportSummaryCards.map((summary) => (
          <article
            className="cursor-pointer rounded-md border border-border bg-surface-raised p-4 text-left transition duration-200 ease-out hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            data-testid="line-detail-card"
            key={summary.line}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setActiveLine(summary.line);
              }
            }}
            onClick={() => setActiveLine(summary.line)}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center justify-between">
              <LineBadge className="px-2 text-sm" line={summary.line} />
              <span className="font-mono text-2xl font-semibold">{formatNumber(summary.reports, locale)}</span>
            </div>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted">
              {dictionary.common.confidence} {dictionary.common[summary.confidence]}
              <span onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                <InfoTooltip label={dictionary.common.confidence}>{dictionary.explore.confidenceHelp}</InfoTooltip>
              </span>
            </p>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <dt className="text-muted">{dictionary.explore.score}</dt>
                <dd className="font-mono font-semibold">{formatNumber(summary.score, locale)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-muted">
                  {dictionary.common.disagreement}
                  <span onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                    <InfoTooltip label={dictionary.common.disagreement}>{dictionary.explore.disagreementHelp}</InfoTooltip>
                  </span>
                </dt>
                <dd className="font-mono font-semibold">{summary.disagreement}%</dd>
              </div>
              <div>
                <dt className="text-muted">{dictionary.explore.latestReport}</dt>
                <dd className="font-mono font-semibold" suppressHydrationWarning>
                  {formatRelativeReportAge(summary.latestReportAt, locale, dictionary.explore.noRecentReport)}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      {activeCars ? (
        <LineCarsModal
          dictionary={dictionary}
          line={activeCars.line}
          locale={locale}
          onClose={() => setActiveLine(null)}
          summary={activeCars}
        />
      ) : null}
    </section>
  );
}

function LineCarsModal({
  dictionary,
  line,
  locale,
  onClose,
  summary,
}: {
  dictionary: Dictionary;
  line: MetroLine;
  locale: Locale;
  onClose: () => void;
  summary: LineCarReportSummary;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function openCarExplorer(car: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("coche", car);
    onClose();
    router.push(`${pathname}?${params.toString()}#car-explorer`);
  }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center overflow-hidden bg-foreground/30 px-4 py-6" onClick={onClose}>
      <section
        aria-modal="true"
        className="max-h-[min(42rem,calc(100dvh-3rem))] w-[min(calc(100vw-2rem),28rem)] overflow-hidden rounded-lg border border-border bg-surface-raised shadow-[var(--shadow-popover)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div>
            <div className="flex items-center gap-2">
              <LineBadge line={line} />
              <h2 className="text-base font-semibold">{dictionary.explore.lineDetails.title}</h2>
            </div>
            <p className="mt-2 text-sm text-muted">
              {dictionary.explore.lineDetails.totalCars}:{" "}
              <span className="font-mono font-semibold text-foreground">{formatNumber(summary.totalCars, locale)}</span>
            </p>
          </div>
          <button
            aria-label={dictionary.common.closeMenu}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-surface hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        <div className="max-h-[min(30rem,calc(100dvh-12rem))] overflow-y-auto overscroll-contain p-4">
          {summary.cars.length > 0 ? (
            <div className="flex flex-col gap-2">
              {summary.cars.map((car) => (
                <button
                  className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border border-border bg-surface p-3 text-left transition duration-200 ease-out hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  key={car.car}
                  onClick={() => openCarExplorer(car.car)}
                  type="button"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <LineBadge line={line} />
                      <span className="font-mono text-sm font-semibold">{formatCarCode(car.car)}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      <HeatReportCounts
                        calor={car.calorReports}
                        calorLabel={dictionary.states.calor.label}
                        fresco={car.frescoReports}
                        frescoLabel={dictionary.states.fresco.label}
                        infierno={car.infiernoReports}
                        infiernoLabel={dictionary.states.infierno.label}
                        hideZero
                        locale={locale}
                      />
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block font-mono text-2xl font-semibold leading-none tabular-nums">{formatNumber(car.reports, locale)}</span>
                    <span className="mt-1 block text-[0.68rem] font-semibold leading-none text-muted">{dictionary.explore.reportsLabel}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-md bg-surface p-3 text-sm text-muted">{dictionary.explore.lineDetails.empty}</p>
          )}
        </div>
      </section>
    </div>
  );
}
