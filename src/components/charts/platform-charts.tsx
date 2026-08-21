"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { Building2, Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { HeatReportCounts } from "@/components/report/heat-report-counts";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/tooltip";
import { LineBadge } from "@/components/ui/line-badge";
import { CHART_TOKENS } from "@/lib/design/tokens";
import { DASHBOARD_LIMITS } from "@/lib/domain/dashboard";
import { LINE_COLORS, METRO_LINES, type MetroLine } from "@/lib/domain/lines";
import { getStationsForLine, normalizeStationSearch } from "@/lib/domain/stations";
import type { TimeRange } from "@/lib/domain/ranges";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatNumber } from "@/lib/i18n/format";
import { getPlatformMessages } from "@/lib/i18n/platform-messages";
import type {
  PlatformDashboardData,
  PlatformExplorerSelection,
  PlatformSummary,
} from "@/lib/server/platform-dashboard";
import { cn } from "@/lib/utils";
import { ChartCard } from "./chart-card";

const PLATFORM_WITHOUT_AC_NET_HEAT_THRESHOLD = 5;

type PlatformIdentity = { line: MetroLine; stationId: string };

type ReportedStationOption = {
  stationId: string;
  stationName: string;
  lines: MetroLine[];
};

export function WorstPlatformsExplorerChartCards({
  data,
  dictionary,
  initialPlatform,
  locale,
  rangeLabel,
  selectedRange,
}: {
  data: Pick<PlatformDashboardData, "platformSummaries">;
  dictionary: Dictionary;
  initialPlatform?: PlatformIdentity | null;
  locale: Locale;
  rangeLabel: string;
  selectedRange: TimeRange;
}) {
  const messages = getPlatformMessages(locale);
  const options = data.platformSummaries;
  const initial =
    (initialPlatform
      ? options.find(
          (platform) =>
            platform.line === initialPlatform.line && platform.stationId === initialPlatform.stationId,
        ) ??
        options.find((platform) => platform.stationId === initialPlatform.stationId)
      : null) ??
    options[0] ??
    null;
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformIdentity | null>(
    initial ? { line: initial.line, stationId: initial.stationId } : null,
  );
  const [activeSelection, setActiveSelection] = useState<PlatformExplorerSelection | null>(null);
  const [isChartPending, setIsChartPending] = useState(Boolean(initial));
  const [loadError, setLoadError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  const selectedStationId = selectedPlatform?.stationId ?? null;
  const selectedLineKey = useMemo(() => {
    if (!selectedStationId) return "";
    return uniqueLines(
      options
        .filter((platform) => platform.stationId === selectedStationId && platform.reports > 0)
        .map((platform) => platform.line),
    ).join(",");
  }, [options, selectedStationId]);

  useEffect(() => {
    if (!selectedStationId || !selectedLineKey) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      linea: selectedLineKey,
      anden: selectedStationId,
      rango: selectedRange,
      lang: locale,
    });
    fetch(`/api/dashboard/platform?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("platform_detail_failed");
        const payload = (await response.json()) as { selection: PlatformExplorerSelection | null };
        setActiveSelection(payload.selection);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setLoadError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsChartPending(false);
      });
    return () => controller.abort();
  }, [locale, requestVersion, selectedLineKey, selectedRange, selectedStationId]);

  function selectPlatform(platform: PlatformIdentity) {
    setActiveSelection(null);
    setIsChartPending(true);
    setLoadError(false);
    setSelectedPlatform(platform);
    setRequestVersion((version) => version + 1);
  }

  return (
    <>
      <ChartCard
        dictionary={dictionary}
        id="worst-platforms"
        rangeLabel={rangeLabel}
        title={messages.explore.worstPlatforms}
      >
        <WorstPlatformsList
          data={data}
          dictionary={dictionary}
          locale={locale}
          onSelectPlatform={(platform) => {
            selectPlatform(platform);
            window.requestAnimationFrame(() => {
              document
                .getElementById("platform-explorer")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
          }}
        />
      </ChartCard>

      <ChartCard
        dictionary={dictionary}
        id="platform-explorer"
        rangeLabel={rangeLabel}
        title={messages.explore.platformExplorerTitle}
      >
        <PlatformExplorer
          activeSelection={activeSelection}
          data={data}
          dictionary={dictionary}
          isChartPending={isChartPending}
          key={selectedStationId ?? "none"}
          loadError={loadError}
          locale={locale}
          onSelectPlatform={selectPlatform}
          selectedPlatform={selectedPlatform}
          selectedRange={selectedRange}
        />
      </ChartCard>
    </>
  );
}

export function PlatformCoveragePanel({
  data,
  dictionary,
  locale,
  rangeLabel,
  selectedLines,
}: {
  data: Pick<PlatformDashboardData, "platformSummaries">;
  dictionary: Dictionary;
  locale: Locale;
  rangeLabel: string;
  selectedLines: MetroLine[];
}) {
  const messages = getPlatformMessages(locale);
  const byLine = new Map<MetroLine, PlatformSummary[]>();
  for (const platform of data.platformSummaries) {
    const rows = byLine.get(platform.line) ?? [];
    rows.push(platform);
    byLine.set(platform.line, rows);
  }

  const lines =
    selectedLines.length > 0
      ? selectedLines
      : METRO_LINES.filter((line) => (byLine.get(line)?.length ?? 0) > 0);
  const summaries = lines
    .map((line) => {
      const platforms = byLine.get(line) ?? [];
      const withoutAc = platforms.filter(
        (platform) =>
          platform.heatReports - platform.frescoReports > PLATFORM_WITHOUT_AC_NET_HEAT_THRESHOLD,
      ).length;
      const totalPlatforms = getStationsForLine(line).length;
      return {
        line,
        withoutAc,
        totalPlatforms,
        percentage: totalPlatforms > 0 ? Math.round((withoutAc / totalPlatforms) * 100) : 0,
        reports: platforms.reduce((sum, platform) => sum + platform.reports, 0),
      };
    })
    .toSorted(
      (a, b) =>
        b.percentage - a.percentage || b.withoutAc - a.withoutAc || b.reports - a.reports,
    );

  const [expanded, setExpanded] = useState(false);
  const visible = summaries.slice(
    0,
    expanded ? summaries.length : DASHBOARD_LIMITS.fleetCollapsedCount,
  );
  const canToggle = summaries.length > DASHBOARD_LIMITS.fleetCollapsedCount;

  return (
    <aside className="flex flex-col gap-4">
      <section
        className="scroll-mt-[13rem] rounded-md border border-border bg-surface-raised p-4"
        id="platform-coverage"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">{messages.explore.platformCoverageTitle}</h2>
          <InfoTooltip label={messages.explore.platformCoverageTitle}>
            {messages.explore.platformCoverageTakeaway}
          </InfoTooltip>
        </div>
        <p className="mt-1 text-xs font-semibold text-muted">
          {dictionary.explore.moduleRange}: {rangeLabel}
        </p>
        {visible.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3">
            {visible.map((summary) => (
              <div key={summary.line}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <LineBadge line={summary.line} />
                  <span className="text-right text-muted">
                    {summary.percentage}% {messages.explore.platformCoverageLabel} (
                    {formatNumber(summary.withoutAc, locale)}/
                    {formatNumber(summary.totalPlatforms, locale)})
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, summary.percentage)}%`,
                      background: LINE_COLORS[summary.line].fill,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyPlatformChart message={messages.explore.noPlatformReports} />
        )}
        {canToggle ? (
          <Button
            className="mt-4 min-h-10 w-full py-2"
            onClick={() => setExpanded((current) => !current)}
            type="button"
            variant="secondary"
          >
            {expanded ? dictionary.explore.showLess : dictionary.explore.showMore}
            <ChevronDown
              aria-hidden="true"
              className={`size-4 transition duration-200 ease-out ${expanded ? "rotate-180" : ""}`}
            />
          </Button>
        ) : null}
      </section>
    </aside>
  );
}

function WorstPlatformsList({
  data,
  dictionary,
  locale,
  onSelectPlatform,
}: {
  data: Pick<PlatformDashboardData, "platformSummaries">;
  dictionary: Dictionary;
  locale: Locale;
  onSelectPlatform: (platform: PlatformIdentity) => void;
}) {
  const messages = getPlatformMessages(locale);
  const [expanded, setExpanded] = useState(false);
  const platforms = data.platformSummaries
    .filter((platform) => platform.heatReports > 0)
    .slice(0, DASHBOARD_LIMITS.worstCarCount);

  if (platforms.length === 0) {
    return <EmptyPlatformChart message={messages.explore.noPlatformReports} />;
  }

  const visible = platforms.slice(
    0,
    expanded ? DASHBOARD_LIMITS.worstCarCount : DASHBOARD_LIMITS.worstCarCollapsedCount,
  );
  const canToggle = platforms.length > DASHBOARD_LIMITS.worstCarCollapsedCount;

  return (
    <div className="flex flex-col gap-2">
      {visible.map((platform) => (
        <button
          className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border border-border bg-surface p-3 text-left transition duration-200 ease-out hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          data-testid="worst-platform-row"
          key={`${platform.line}:${platform.stationId}`}
          onClick={() => onSelectPlatform({ line: platform.line, stationId: platform.stationId })}
          type="button"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <LineBadge line={platform.line} />
              <span className="truncate text-sm font-semibold">{platform.stationName}</span>
            </div>
            <p className="mt-1 text-xs text-muted">
              {dictionary.common.confidence} {dictionary.common[platform.confidence]}
              <span className="mx-1 text-muted">·</span>
              <HeatReportCounts
                calor={platform.calorReports}
                calorLabel={dictionary.states.calor.label}
                infierno={platform.infiernoReports}
                infiernoLabel={dictionary.states.infierno.label}
                locale={locale}
              />
            </p>
          </div>
          <div className="text-right">
            <span className="block font-mono text-2xl font-semibold leading-none tabular-nums">
              {formatNumber(platform.heatReports, locale)}
            </span>
            <span className="mt-1 block text-[0.68rem] font-semibold leading-none text-muted">
              {dictionary.explore.reportsLabel}
            </span>
          </div>
        </button>
      ))}
      {canToggle ? (
        <Button
          className="mt-1 min-h-10 py-2"
          onClick={() => setExpanded((current) => !current)}
          type="button"
          variant="secondary"
        >
          {expanded ? dictionary.explore.showLess : dictionary.explore.showMore}
          <ChevronDown
            aria-hidden="true"
            className={`size-4 transition duration-200 ease-out ${expanded ? "rotate-180" : ""}`}
          />
        </Button>
      ) : null}
    </div>
  );
}

function PlatformExplorer({
  activeSelection,
  data,
  dictionary,
  isChartPending,
  loadError,
  locale,
  onSelectPlatform,
  selectedPlatform,
  selectedRange,
}: {
  activeSelection: PlatformExplorerSelection | null;
  data: Pick<PlatformDashboardData, "platformSummaries">;
  dictionary: Dictionary;
  isChartPending: boolean;
  loadError: boolean;
  locale: Locale;
  onSelectPlatform: (platform: PlatformIdentity) => void;
  selectedPlatform: PlatformIdentity | null;
  selectedRange: TimeRange;
}) {
  const messages = getPlatformMessages(locale);
  const options = useMemo(
    () => buildReportedStationOptions(data.platformSummaries),
    [data.platformSummaries],
  );
  const selected = selectedPlatform
    ? options.find((option) => option.stationId === selectedPlatform.stationId) ?? null
    : null;

  if (options.length === 0) {
    return <EmptyPlatformChart message={messages.explore.platformExplorer.empty} />;
  }

  return (
    <div>
      <ReportedStationCombobox
        label={messages.explore.platformExplorer.label}
        locale={locale}
        onSelect={(option) =>
          onSelectPlatform({ line: option.lines[0], stationId: option.stationId })
        }
        options={options}
        placeholder={messages.explore.platformExplorer.placeholder}
        selected={selected}
      />

      {loadError ? (
        <p className="mt-2 rounded-md bg-surface p-3 text-sm text-danger">
          {messages.explore.platformExplorer.loadError}
        </p>
      ) : null}

      {isChartPending ? (
        <PlatformExplorerChartSkeleton />
      ) : activeSelection ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-md border border-border bg-surface p-3">
              <p className="text-xs font-semibold text-muted">
                {messages.explore.platformExplorer.reportedLines}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeSelection.lines.map((line) => (
                  <LineBadge line={line} key={line} />
                ))}
              </div>
            </div>
            <div className="rounded-md border border-border bg-surface p-3">
              <p className="text-xs font-semibold text-muted">
                {messages.explore.platformExplorer.totalReports}
              </p>
              <div className="mt-1 grid grid-cols-[auto_1fr] items-center justify-end gap-2">
                <span className="font-mono text-3xl font-semibold leading-none tabular-nums">
                  {formatNumber(activeSelection.reports, locale)}
                </span>
                <HeatReportCounts
                  calor={activeSelection.calorReports}
                  calorLabel={dictionary.states.calor.label}
                  infierno={activeSelection.infiernoReports}
                  infiernoLabel={dictionary.states.infierno.label}
                  locale={locale}
                  orientation="stack"
                />
              </div>
            </div>
          </div>
          <div
            className={`${CHART_TOKENS.moduleHeightClass} mt-4`}
            data-testid="platform-explorer-chart"
          >
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={activeSelection.history} margin={CHART_TOKENS.compactMargin}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="label"
                  interval={
                    selectedRange === "today"
                      ? 2
                      : selectedRange === "sevenDays"
                        ? 0
                        : "preserveStartEnd"
                  }
                  tickLine={false}
                />
                <YAxis axisLine={false} allowDecimals={false} tickLine={false} />
                <Tooltip
                  content={
                    <PlatformTooltip labelName={dictionary.common.reports} locale={locale} />
                  }
                  cursor={{ fill: "var(--surface)" }}
                />
                <Bar
                  animationDuration={CHART_TOKENS.animationDurationMs}
                  dataKey="reports"
                  fill="var(--accent)"
                  name={dictionary.common.reports}
                  radius={CHART_TOKENS.barRadius}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : null}
    </div>
  );
}

function ReportedStationCombobox({
  label,
  locale,
  onSelect,
  options,
  placeholder,
  selected,
}: {
  label: string;
  locale: Locale;
  onSelect: (option: ReportedStationOption) => void;
  options: ReportedStationOption[];
  placeholder: string;
  selected: ReportedStationOption | null;
}) {
  const [query, setQuery] = useState(selected?.stationName ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState(false);
  const listboxId = useId();
  const normalizedQuery = normalizeStationSearch(query);
  const results = useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      normalizeStationSearch(option.stationName).includes(normalizedQuery),
    );
  }, [normalizedQuery, options]);

  function choose(option: ReportedStationOption) {
    setQuery(option.stationName);
    setOpen(false);
    setActiveIndex(0);
    setError(false);
    onSelect(option);
  }

  function handleBlur() {
    const exact = options.find(
      (option) => normalizeStationSearch(option.stationName) === normalizeStationSearch(query),
    );
    if (exact) {
      choose(exact);
      return;
    }
    window.setTimeout(() => setOpen(false), 0);
  }

  return (
    <div>
      <label className="sr-only" htmlFor="platform-explorer-input">
        {label}
      </label>
      <div className="relative">
        <Building2
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        />
        <input
          aria-activedescendant={
            open && results[activeIndex]
              ? `${listboxId}-${results[activeIndex].stationId}`
              : undefined
          }
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={open}
          aria-invalid={error}
          className="min-h-11 w-full rounded-md border border-border bg-background py-2 pl-9 pr-9 text-sm font-semibold outline-none transition duration-200 ease-out placeholder:text-muted focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          id="platform-explorer-input"
          onBlur={handleBlur}
          onChange={(event) => {
            setQuery(event.target.value);
            setError(false);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) =>
                Math.min(index + 1, Math.max(0, results.length - 1)),
              );
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => Math.max(0, index - 1));
            } else if (event.key === "Enter") {
              event.preventDefault();
              if (open && results[activeIndex]) {
                choose(results[activeIndex]);
              } else {
                const exact = options.find(
                  (option) =>
                    normalizeStationSearch(option.stationName) === normalizeStationSearch(query),
                );
                if (exact) choose(exact);
                else setError(true);
              }
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          role="combobox"
          value={query}
        />
        {selected && normalizeStationSearch(query) === normalizeStationSearch(selected.stationName) ? (
          <Check
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-primary"
          />
        ) : null}

        {open && results.length > 0 ? (
          <ul
            className="absolute left-0 right-0 top-full z-[var(--z-popover)] mt-1 max-h-60 overflow-y-auto rounded-md border border-border bg-surface-raised p-1 shadow-[var(--shadow-popover)]"
            id={listboxId}
            role="listbox"
          >
            {results.map((option, index) => {
              const active = index === activeIndex;
              const isSelected = option.stationId === selected?.stationId;
              return (
                <li
                  aria-selected={isSelected}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-2 transition",
                    active ? "bg-surface text-foreground" : "text-foreground hover:bg-surface",
                  )}
                  id={`${listboxId}-${option.stationId}`}
                  key={option.stationId}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    choose(option);
                  }}
                  role="option"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {option.stationName}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1.5">
                      {option.lines.map((line) => (
                        <LineBadge line={line} key={line} />
                      ))}
                    </span>
                  </span>
                  {isSelected ? <Check aria-hidden="true" className="size-4 shrink-0 text-primary" /> : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      {error ? (
        <p className="mt-2 text-[0.6875rem] font-semibold leading-4 text-danger">
          {getPlatformMessages(locale).explore.platformExplorer.invalid}
        </p>
      ) : null}
    </div>
  );
}

function PlatformExplorerChartSkeleton() {
  return (
    <div
      className={`${CHART_TOKENS.moduleHeightClass} mt-4 rounded-md bg-surface p-3`}
      data-testid="platform-explorer-loading"
    >
      <div className="flex h-full items-end gap-2">
        {Array.from({ length: 12 }, (_, index) => (
          <span
            aria-hidden="true"
            className="flex-1 animate-pulse rounded-sm bg-border"
            key={index}
            style={{ height: `${28 + ((index * 17) % 56)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function EmptyPlatformChart({ message }: { message: string }) {
  return <div className="grid min-h-44 place-items-center text-center text-sm text-muted">{message}</div>;
}

function PlatformTooltip({
  active,
  payload,
  label,
  labelName,
  locale,
}: Partial<TooltipContentProps<number, string>> & { labelName: string; locale: Locale }) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0]?.value ?? 0);
  return (
    <div className="rounded-md border border-border bg-surface-raised px-3 py-2 text-xs shadow-[var(--shadow-popover)]">
      <p className="font-semibold text-foreground">{String(label ?? "")}</p>
      <p className="mt-1 text-muted">
        {labelName}:{" "}
        <span className="font-semibold text-foreground">{formatNumber(value, locale)}</span>
      </p>
    </div>
  );
}

function buildReportedStationOptions(platforms: PlatformSummary[]): ReportedStationOption[] {
  const grouped = new Map<string, { stationId: string; stationName: string; lines: Set<MetroLine> }>();
  for (const platform of platforms) {
    if (platform.reports <= 0) continue;
    const current = grouped.get(platform.stationId) ?? {
      stationId: platform.stationId,
      stationName: platform.stationName,
      lines: new Set<MetroLine>(),
    };
    current.lines.add(platform.line);
    grouped.set(platform.stationId, current);
  }

  return Array.from(grouped.values())
    .map((option) => ({
      stationId: option.stationId,
      stationName: option.stationName,
      lines: uniqueLines(Array.from(option.lines)),
    }))
    .toSorted((a, b) => a.stationName.localeCompare(b.stationName));
}

function uniqueLines(lines: MetroLine[]) {
  return [...new Set(lines)].toSorted(
    (a, b) => METRO_LINES.indexOf(a) - METRO_LINES.indexOf(b),
  );
}
