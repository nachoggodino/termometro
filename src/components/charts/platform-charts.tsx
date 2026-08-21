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
import { ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { HeatReportCounts } from "@/components/report/heat-report-counts";
import { Button } from "@/components/ui/button";
import { LineBadge } from "@/components/ui/line-badge";
import { CHART_TOKENS } from "@/lib/design/tokens";
import { DASHBOARD_LIMITS } from "@/lib/domain/dashboard";
import { LINE_COLORS, METRO_LINES, type MetroLine } from "@/lib/domain/lines";
import { getStationsForLine } from "@/lib/domain/stations";
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
import { ChartCard } from "./chart-card";

const PLATFORM_WITHOUT_AC_NET_HEAT_THRESHOLD = 5;

type PlatformIdentity = { line: MetroLine; stationId: string };

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
        )
      : null) ?? options[0] ?? null;
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformIdentity | null>(
    initial ? { line: initial.line, stationId: initial.stationId } : null,
  );
  const [activeSelection, setActiveSelection] = useState<PlatformExplorerSelection | null>(null);
  const [isChartPending, setIsChartPending] = useState(Boolean(initial));
  const [loadError, setLoadError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    if (!selectedPlatform) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      linea: selectedPlatform.line,
      anden: selectedPlatform.stationId,
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
  }, [locale, requestVersion, selectedPlatform, selectedRange]);

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
        takeaway={messages.explore.worstPlatformsTakeaway}
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
        takeaway={messages.explore.platformExplorerTakeaway}
        title={messages.explore.platformExplorerTitle}
      >
        <PlatformExplorer
          activeSelection={activeSelection}
          data={data}
          dictionary={dictionary}
          isChartPending={isChartPending}
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

  const lines = selectedLines.length > 0 ? selectedLines : METRO_LINES.filter((line) => (byLine.get(line)?.length ?? 0) > 0);
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
    .toSorted((a, b) => b.percentage - a.percentage || b.withoutAc - a.withoutAc || b.reports - a.reports);

  const [expanded, setExpanded] = useState(false);
  const visible = summaries.slice(0, expanded ? summaries.length : DASHBOARD_LIMITS.fleetCollapsedCount);
  const canToggle = summaries.length > DASHBOARD_LIMITS.fleetCollapsedCount;

  return (
    <aside className="flex flex-col gap-4">
      <section
        className="scroll-mt-[13rem] rounded-md border border-border bg-surface-raised p-4"
        id="platform-coverage"
      >
        <h2 className="text-base font-semibold">{messages.explore.platformCoverageTitle}</h2>
        <p className="mt-1 text-xs font-semibold text-muted">
          {dictionary.explore.moduleRange}: {rangeLabel}
        </p>
        <p className="mt-2 text-xs leading-4 text-muted">{messages.explore.platformCoverageTakeaway}</p>
        {visible.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3">
            {visible.map((summary) => (
              <div key={summary.line}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <LineBadge line={summary.line} />
                  <span className="text-right text-muted">
                    {summary.percentage}% {messages.explore.platformCoverageLabel} (
                    {formatNumber(summary.withoutAc, locale)}/{formatNumber(summary.totalPlatforms, locale)})
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
  const options = data.platformSummaries;
  const selected = selectedPlatform
    ? options.find(
        (platform) =>
          platform.line === selectedPlatform.line && platform.stationId === selectedPlatform.stationId,
      ) ?? null
    : null;
  const labels = useMemo(
    () =>
      options.map((platform) => ({
        platform,
        label: `${platform.stationName} · ${platform.line}`,
      })),
    [options],
  );
  const [draft, setDraft] = useState(selected ? `${selected.stationName} · ${selected.line}` : "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selected) setDraft(`${selected.stationName} · ${selected.line}`);
  }, [selected]);

  function submitSelection() {
    const match = labels.find((option) => option.label.toLocaleLowerCase(locale) === draft.trim().toLocaleLowerCase(locale));
    if (!match) {
      setError(messages.explore.platformExplorer.invalid);
      return;
    }
    setDraft(match.label);
    setError(null);
    onSelectPlatform({ line: match.platform.line, stationId: match.platform.stationId });
  }

  if (options.length === 0) {
    return <EmptyPlatformChart message={messages.explore.platformExplorer.empty} />;
  }

  return (
    <div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div>
          <label className="sr-only" htmlFor="platform-explorer-input">
            {messages.explore.platformExplorer.label}
          </label>
          <input
            className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm font-semibold outline-none transition duration-200 ease-out placeholder:text-muted focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            id="platform-explorer-input"
            list="platform-explorer-options"
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitSelection();
              }
            }}
            placeholder={messages.explore.platformExplorer.placeholder}
            value={draft}
          />
          <datalist id="platform-explorer-options">
            {labels.map((option) => (
              <option
                key={`${option.platform.line}:${option.platform.stationId}`}
                value={option.label}
              />
            ))}
          </datalist>
        </div>
        <Button
          aria-label={messages.explore.platformExplorer.search}
          className="size-11 min-h-0 px-0 py-0"
          onClick={submitSelection}
          type="button"
          variant="secondary"
        >
          <Search aria-hidden="true" className="size-4" />
        </Button>
      </div>
      {error ? <p className="mt-2 text-[0.6875rem] font-semibold leading-4 text-danger">{error}</p> : null}
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
              <p className="text-xs font-semibold text-muted">{messages.explore.platformExplorer.line}</p>
              <div className="mt-2">
                <LineBadge line={activeSelection.line} />
              </div>
              <p className="mt-2 text-sm font-semibold">{activeSelection.stationName}</p>
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
                  fresco={activeSelection.frescoReports}
                  frescoLabel={dictionary.states.fresco.label}
                  infierno={activeSelection.infiernoReports}
                  infiernoLabel={dictionary.states.infierno.label}
                  locale={locale}
                  orientation="stack"
                />
              </div>
            </div>
          </div>
          <div className={`${CHART_TOKENS.moduleHeightClass} mt-4`} data-testid="platform-explorer-chart">
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
                  content={<PlatformTooltip labelName={dictionary.common.reports} locale={locale} />}
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
        {labelName}: <span className="font-semibold text-foreground">{formatNumber(value, locale)}</span>
      </p>
    </div>
  );
}
