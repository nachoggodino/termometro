"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { DASHBOARD_LIMITS, type DashboardData } from "@/lib/domain/dashboard";
import { CHART_TOKENS, SERIES_CHART_COLORS } from "@/lib/design/tokens";
import { LINE_COLORS, METRO_LINES, type MetroLine } from "@/lib/domain/lines";
import type { TimeRange } from "@/lib/domain/ranges";
import { formatCarCode, normalizeCarCode } from "@/lib/domain/reports";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { formatNumber } from "@/lib/i18n/format";
import { LineBadge } from "@/components/ui/line-badge";
import { Button } from "@/components/ui/button";
import { HeatReportCounts } from "@/components/report/heat-report-counts";
import { ChartCard } from "./chart-card";

type ChartModuleBaseProps = {
  dictionary: Dictionary;
  locale: Locale;
  rangeLabel: string;
  selectedRange: TimeRange;
  selectedLines: MetroLine[];
};

export function LineEvolutionChartCard({
  data,
  dictionary,
  locale,
  rangeLabel,
  selectedRange,
  selectedLines,
}: ChartModuleBaseProps & {
  data: Pick<DashboardData, "lineEvolution">;
}) {
  const lineEvolutionLines = selectedLines.length > 0 ? selectedLines : METRO_LINES;
  const xAxisInterval = selectedRange === "today" ? 2 : selectedRange === "sevenDays" ? 0 : "preserveStartEnd";

  return (
    <ChartCard
      dictionary={dictionary}
      id="line-evolution"
      rangeLabel={rangeLabel}
      title={dictionary.explore.modules.lineEvolution}
    >
      <div className={CHART_TOKENS.moduleHeightClass}>
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={data.lineEvolution} margin={CHART_TOKENS.compactMargin}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis axisLine={false} dataKey="label" interval={xAxisInterval} tickLine={false} />
            <YAxis axisLine={false} allowDecimals={false} tickLine={false} />
            <Tooltip content={<LocalizedTooltip labelName={dictionary.common.reports} locale={locale} />} />
            {lineEvolutionLines.map((line) => (
              <Line
                animationDuration={CHART_TOKENS.animationDurationMs}
                dataKey={line}
                dot={false}
                key={line}
                stroke={LINE_COLORS[line].fill}
                strokeWidth={2}
                type="monotone"
                name={line}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function TotalReportsChartCard({
  data,
  dictionary,
  locale,
  rangeLabel,
  selectedRange,
}: ChartModuleBaseProps & {
  data: Pick<DashboardData, "totalReportsTrend">;
}) {
  const totalReportsXAxisInterval = selectedRange === "today" || selectedRange === "sevenDays" ? 0 : "preserveStartEnd";

  return (
    <ChartCard
      dictionary={dictionary}
      id="total-reports"
      rangeLabel={rangeLabel}
      takeaway={dictionary.explore.chartTakeaways.totalReports}
      title={dictionary.explore.modules.totalReports}
    >
      <div className={CHART_TOKENS.moduleHeightClass}>
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={data.totalReportsTrend} margin={CHART_TOKENS.compactMargin}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis axisLine={false} dataKey="label" interval={totalReportsXAxisInterval} tickLine={false} />
            <YAxis axisLine={false} allowDecimals={false} tickLine={false} />
            <Tooltip content={<LocalizedTooltip labelName={dictionary.common.reports} locale={locale} />} />
            <Line
              animationDuration={CHART_TOKENS.animationDurationMs}
              dataKey="reports"
              dot={data.totalReportsTrend.length <= 1}
              name={dictionary.common.reports}
              stroke="var(--primary)"
              strokeWidth={2}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function ReportVolumeChartCard({
  data,
  dictionary,
  locale,
  rangeLabel,
  selectedLines,
}: Omit<ChartModuleBaseProps, "selectedRange"> & {
  data: Pick<DashboardData, "lineSummaries">;
}) {
  const visibleLines = data.lineSummaries.filter((summary) => (selectedLines.length > 0 ? selectedLines.includes(summary.line) : summary.reports > 0));
  const reportVolumeLines = (selectedLines.length > 0 ? visibleLines : visibleLines.slice(0, DASHBOARD_LIMITS.topLineCount)).toSorted((a, b) => b.reports - a.reports || b.score - a.score);

  return (
    <ChartCard
      dictionary={dictionary}
      id="report-volume"
      rangeLabel={rangeLabel}
      takeaway={dictionary.explore.chartTakeaways.volume}
      title={dictionary.explore.modules.volume}
    >
      <div className={CHART_TOKENS.moduleHeightClass}>
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={reportVolumeLines} margin={CHART_TOKENS.compactMargin}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis axisLine={false} dataKey="line" tickLine={false} />
            <YAxis axisLine={false} allowDecimals={false} tickLine={false} />
            <Tooltip content={<LocalizedTooltip labelName={dictionary.common.reports} locale={locale} />} cursor={{ fill: "var(--surface)" }} />
            <Bar animationDuration={CHART_TOKENS.animationDurationMs} dataKey="reports" name={dictionary.common.reports} radius={CHART_TOKENS.barRadius}>
              {reportVolumeLines.map((item) => (
                <Cell fill={LINE_COLORS[item.line].fill} key={item.line} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function LineCarsChartCard({
  data,
  dictionary,
  locale,
  rangeLabel,
  selectedLines,
}: Omit<ChartModuleBaseProps, "selectedRange"> & {
  data: Pick<DashboardData, "lineSummaries">;
}) {
  const visibleLines = data.lineSummaries.filter((summary) => (selectedLines.length > 0 ? selectedLines.includes(summary.line) : summary.reports > 0));
  const carLines = (selectedLines.length > 0 ? visibleLines : visibleLines.slice(0, DASHBOARD_LIMITS.topLineCount)).toSorted((a, b) => b.carsReported - a.carsReported || b.score - a.score);

  return (
    <ChartCard
      dictionary={dictionary}
      id="line-cars"
      rangeLabel={rangeLabel}
      takeaway={dictionary.explore.chartTakeaways.lineCars}
      title={dictionary.explore.modules.lineCars}
    >
      <div className={CHART_TOKENS.moduleHeightClass}>
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={carLines} margin={CHART_TOKENS.compactMargin}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis axisLine={false} dataKey="line" tickLine={false} />
            <YAxis axisLine={false} allowDecimals={false} tickLine={false} />
            <Tooltip content={<LocalizedTooltip labelName={dictionary.explore.carsReportedLabel} locale={locale} />} cursor={{ fill: "var(--surface)" }} />
            <Bar animationDuration={CHART_TOKENS.animationDurationMs} dataKey="carsReported" name={dictionary.explore.carsReportedLabel} radius={CHART_TOKENS.barRadius}>
              {carLines.map((item) => (
                <Cell fill={LINE_COLORS[item.line].fill} key={item.line} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function CarSeriesChartCard({
  data,
  dictionary,
  locale,
  rangeLabel,
}: Omit<ChartModuleBaseProps, "selectedRange" | "selectedLines"> & {
  data: Pick<DashboardData, "carSeries">;
}) {
  return (
    <ChartCard
      dictionary={dictionary}
      id="car-series"
      rangeLabel={rangeLabel}
      takeaway={dictionary.explore.chartTakeaways.carSeries}
      title={dictionary.explore.modules.carSeries}
    >
      {data.carSeries.length > 0 ? (
        <div className={CHART_TOKENS.moduleHeightClass}>
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={data.carSeries} margin={CHART_TOKENS.compactMargin}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis axisLine={false} dataKey="label" height={42} interval={0} tick={<AngledXAxisTick />} tickLine={false} />
              <YAxis axisLine={false} allowDecimals={false} tickLine={false} />
              <Tooltip content={<LocalizedTooltip labelName={dictionary.common.reports} locale={locale} footer={dictionary.explore.seriesLabel} />} cursor={{ fill: "var(--surface)" }} />
              <Bar animationDuration={CHART_TOKENS.animationDurationMs} dataKey="reports" name={dictionary.common.reports} radius={CHART_TOKENS.barRadius}>
                {data.carSeries.map((item, index) => (
                  <Cell fill={SERIES_CHART_COLORS[index % SERIES_CHART_COLORS.length]} key={item.series} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="rounded-md bg-surface p-3 text-sm text-muted">{dictionary.explore.carExplorer.empty}</p>
      )}
    </ChartCard>
  );
}

export function WorstCarsExplorerChartCards({
  data,
  dictionary,
  locale,
  rangeLabel,
  selectedRange,
  initialCar,
}: Omit<ChartModuleBaseProps, "selectedLines"> & {
  data: Pick<DashboardData, "worstCars" | "carExplorer">;
  initialCar?: string | null;
}) {
  const initialSelectionCar: string | null = initialCar && data.carExplorer.selections.some((selection) => selection.car === initialCar) ? initialCar : data.carExplorer.defaultCar?.car ?? null;
  const [selectedCar, setSelectedCar] = useState(initialSelectionCar);

  return (
    <>
      <ChartCard
        dictionary={dictionary}
        id="worst-cars"
        rangeLabel={rangeLabel}
        takeaway={dictionary.explore.chartTakeaways.worstCars}
        title={dictionary.explore.modules.worstCars}
      >
        <WorstCarsList
          data={data}
          dictionary={dictionary}
          locale={locale}
          collapsedCount={DASHBOARD_LIMITS.worstCarCollapsedCount}
          expandedCount={DASHBOARD_LIMITS.worstCarCount}
          onSelectCar={(car) => {
            setSelectedCar(car);
            window.requestAnimationFrame(() => {
              document.getElementById("car-explorer")?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
          }}
        />
      </ChartCard>

      <ChartCard
        dictionary={dictionary}
        id="car-explorer"
        rangeLabel={rangeLabel}
        title={dictionary.explore.modules.carExplorer}
      >
        <CarExplorer
          data={data}
          dictionary={dictionary}
          key={`${selectedRange}-${selectedCar ?? "none"}-${data.carExplorer.options.length}`}
          locale={locale}
          selectedCar={selectedCar}
          onSelectCar={setSelectedCar}
          selectedRange={selectedRange}
        />
      </ChartCard>
    </>
  );
}

export function HeatTrendChartCard({
  data,
  dictionary,
  locale,
  rangeLabel,
  selectedRange,
  selectedLines,
}: ChartModuleBaseProps & {
  data: Pick<DashboardData, "trend" | "lineSummaries">;
}) {
  const heatTrendLines = selectedLines.length > 0 ? selectedLines : data.lineSummaries.map((summary) => summary.line);
  const xAxisInterval = selectedRange === "today" ? 2 : selectedRange === "sevenDays" ? 0 : "preserveStartEnd";

  return (
    <ChartCard
      dictionary={dictionary}
      help={dictionary.explore.fleetAdjustedScoreHelp}
      id="heat-trend"
      rangeLabel={rangeLabel}
      takeaway={dictionary.explore.chartTakeaways.trend}
      title={dictionary.explore.modules.trend}
    >
      <div className={CHART_TOKENS.moduleHeightClass}>
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={data.trend} margin={CHART_TOKENS.compactMargin}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis axisLine={false} dataKey="label" interval={xAxisInterval} tickLine={false} />
            <YAxis axisLine={false} tickFormatter={(value) => formatNumber(Number(value), locale)} tickLine={false} />
            <Tooltip content={<LocalizedTooltip labelName={dictionary.explore.fleetAdjustedScoreLabel} locale={locale} />} />
            {heatTrendLines.map((line) => (
              <Line
                animationDuration={CHART_TOKENS.animationDurationMs}
                dataKey={line}
                dot={false}
                key={line}
                name={line}
                stroke={LINE_COLORS[line].fill}
                strokeWidth={2}
                type="monotone"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <LineLegend lines={heatTrendLines} />
    </ChartCard>
  );
}

export function WorstHoursChartCard({
  data,
  dictionary,
  locale,
  rangeLabel,
}: Omit<ChartModuleBaseProps, "selectedRange" | "selectedLines"> & {
  data: Pick<DashboardData, "worstHours">;
}) {
  return (
    <ChartCard
      dictionary={dictionary}
      id="worst-hours"
      rangeLabel={rangeLabel}
      takeaway={dictionary.explore.chartTakeaways.worstHours}
      title={dictionary.explore.modules.worstHours}
    >
      <div className={CHART_TOKENS.moduleHeightClass}>
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data.worstHours} margin={CHART_TOKENS.compactMargin}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis axisLine={false} dataKey="label" height={CHART_TOKENS.hourTickHeightPx} interval={0} tick={<HourTick />} tickLine={false} />
            <YAxis axisLine={false} allowDecimals={false} tickLine={false} />
            <Tooltip content={<LocalizedTooltip labelName={dictionary.common.reports} locale={locale} footer={dictionary.explore.hourIntervalLabel} />} cursor={{ fill: "var(--surface)" }} />
            <Bar animationDuration={CHART_TOKENS.animationDurationMs} dataKey="reports" fill="var(--accent)" name={dictionary.common.reports} radius={CHART_TOKENS.barRadius} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function CarExplorer({
  data,
  dictionary,
  locale,
  selectedCar,
  onSelectCar,
  selectedRange,
}: {
  data: Pick<DashboardData, "carExplorer">;
  dictionary: Dictionary;
  locale: Locale;
  selectedCar: string | null;
  onSelectCar: (car: string) => void;
  selectedRange: TimeRange;
}) {
  const defaultCar = data.carExplorer.defaultCar;
  const activeCar = data.carExplorer.selections.some((selection) => selection.car === selectedCar) ? selectedCar : defaultCar?.car ?? null;
  const [draftCar, setDraftCar] = useState(activeCar ? formatCarCode(activeCar) : "");
  const [isChartPending, setIsChartPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = data.carExplorer.options;
  const optionCars = useMemo(() => new Set(options.map((option) => option.car)), [options]);
  const activeSelection = data.carExplorer.selections.find((selection) => selection.car === activeCar) ?? defaultCar;

  function submitSelection() {
    const normalized = normalizeCarCode(draftCar);
    if (!normalized || !optionCars.has(normalized)) {
      setError(dictionary.explore.carExplorer.invalid);
      return;
    }
    setDraftCar(formatCarCode(normalized));
    setError(null);
    if (normalized === activeCar) return;
    setIsChartPending(true);
    window.setTimeout(() => {
      onSelectCar(normalized);
      setIsChartPending(false);
    }, 180);
  }

  if (!defaultCar) {
    return <p className="rounded-md bg-surface p-3 text-sm text-muted">{dictionary.explore.carExplorer.empty}</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div>
          <label className="sr-only" htmlFor="car-explorer-input">
            {dictionary.explore.carExplorer.label}
          </label>
          <input
            className="min-h-11 w-full rounded-md border border-border bg-background px-3 font-mono text-sm font-semibold outline-none transition duration-200 ease-out placeholder:text-muted focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            id="car-explorer-input"
            list="car-explorer-options"
            onChange={(event) => {
              setDraftCar(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitSelection();
              }
            }}
            placeholder={dictionary.explore.carExplorer.placeholder}
            suppressHydrationWarning
            value={draftCar}
          />
          <datalist id="car-explorer-options">
            {options.map((option) => (
              <option key={option.car} value={formatCarCode(option.car)} />
            ))}
          </datalist>
        </div>
        <Button aria-label={dictionary.explore.carExplorer.search} className="size-11 min-h-0 px-0 py-0" onClick={submitSelection} type="button" variant="secondary">
          <Search aria-hidden="true" className="size-4" />
        </Button>
      </div>
      {error ? <p className="mt-2 text-[0.6875rem] font-semibold leading-4 text-danger">{error}</p> : null}

      {activeSelection ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-md border border-border bg-surface p-3">
              <p className="text-xs font-semibold text-muted">{dictionary.explore.carExplorer.reportedLines}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeSelection.lines.map((line) => (
                  <LineBadge line={line} key={line} />
                ))}
              </div>
            </div>
            <div className="rounded-md border border-border bg-surface p-3">
              <p className="text-xs font-semibold text-muted">{dictionary.explore.carExplorer.totalReports}</p>
              <div className="mt-1 grid grid-cols-[auto_1fr] items-center justify-end gap-2">
                <span className="font-mono text-3xl font-semibold leading-none tabular-nums">{formatNumber(activeSelection.reports, locale)}</span>
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
          {isChartPending ? (
            <CarExplorerChartSkeleton />
          ) : (
            <div className={`${CHART_TOKENS.moduleHeightClass} mt-4`}>
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={activeSelection.history} margin={CHART_TOKENS.compactMargin}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis axisLine={false} dataKey="label" interval={selectedRange === "today" ? 2 : selectedRange === "sevenDays" ? 0 : "preserveStartEnd"} tickLine={false} />
                  <YAxis axisLine={false} allowDecimals={false} tickLine={false} />
                  <Tooltip content={<LocalizedTooltip labelName={dictionary.common.reports} locale={locale} />} cursor={{ fill: "var(--surface)" }} />
                  <Bar animationDuration={CHART_TOKENS.animationDurationMs} dataKey="reports" fill="var(--accent)" name={dictionary.common.reports} radius={CHART_TOKENS.barRadius} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function CarExplorerChartSkeleton() {
  return (
    <div className={`${CHART_TOKENS.moduleHeightClass} mt-4 rounded-md bg-surface p-3`}>
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

function AngledXAxisTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
}) {
  if (typeof x !== "number" || typeof y !== "number") return null;
  return (
    <g transform={`translate(${x},${y + 10})`}>
      <text fill="var(--muted)" fontSize={CHART_TOKENS.angledTickFontSizePx} textAnchor="end" transform="rotate(-35)">
        {payload?.value ?? ""}
      </text>
    </g>
  );
}

function HourTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
}) {
  if (typeof x !== "number" || typeof y !== "number") return null;
  return (
    <g transform={`translate(${x},${y + 10})`}>
      <text fill="var(--muted)" fontSize={CHART_TOKENS.hourTickFontSizePx} textAnchor="middle">
        {payload?.value ?? ""}
      </text>
    </g>
  );
}

function LocalizedTooltip({
  active,
  payload,
  label,
  labelName,
  locale,
  footer,
}: Partial<TooltipContentProps<number, string>> & {
  labelName: string;
  locale: Locale;
  footer?: string;
}) {
  if (!active || !payload?.length) return null;
  const visiblePayload = payload
    .filter((item) => typeof item.value === "number")
    .toSorted((a, b) => Number(b.value) - Number(a.value))
    .slice(0, CHART_TOKENS.tooltipPayloadLimit);

  return (
    <div className="max-w-64 rounded-md border border-border bg-surface-raised px-3 py-2 text-xs text-foreground shadow-[var(--shadow-popover)]">
      <p className="mb-2 font-semibold">{label}</p>
      <div className="flex flex-col gap-1">
        {visiblePayload.map((item) => (
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2" key={`${item.name}-${item.dataKey}`}>
            <span aria-hidden="true" className="size-2 rounded-full" style={{ background: item.color }} />
            <span className="text-muted">{String(item.name ?? labelName)}</span>
            <span className="font-mono font-semibold tabular-nums">{formatNumber(Number(item.value), locale)}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 border-t border-border pt-2 leading-4 text-muted">{footer ?? labelName}</p>
    </div>
  );
}

function LineLegend({ lines }: { lines: MetroLine[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
      {lines.map((line) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted" key={line}>
          <span aria-hidden="true" className="h-2 w-3 rounded-full" style={{ background: LINE_COLORS[line].fill }} />
          {line}
        </span>
      ))}
    </div>
  );
}

function WorstCarsList({
  data,
  dictionary,
  locale,
  collapsedCount,
  expandedCount,
  onSelectCar,
}: {
  data: Pick<DashboardData, "worstCars">;
  dictionary: Dictionary;
  locale: Locale;
  collapsedCount: number;
  expandedCount: number;
  onSelectCar: (car: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (data.worstCars.length === 0) {
    return <p className="rounded-md bg-surface p-3 text-sm text-muted">{dictionary.explore.noRecentReport}</p>;
  }

  const visibleCars = data.worstCars.slice(0, expanded ? expandedCount : collapsedCount);
  const canToggle = data.worstCars.length > collapsedCount;

  return (
    <div className="flex flex-col gap-2">
      {visibleCars.map((car) => (
        <button
          className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border border-border bg-surface p-3 text-left transition duration-200 ease-out hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          data-testid="worst-car-row"
          key={car.car}
          onClick={() => onSelectCar(car.car)}
          type="button"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex flex-wrap gap-1.5">
                {car.lines.map((line) => (
                  <LineBadge line={line} key={line} />
                ))}
              </span>
              <span className="font-mono text-sm font-semibold">{formatCarCode(car.car)}</span>
            </div>
            <p className="mt-1 text-xs text-muted">
              {dictionary.common.confidence} {dictionary.common[car.confidence]}
              <span className="mx-1 text-muted">·</span>
              <HeatReportCounts
                calor={car.calorReports}
                calorLabel={dictionary.states.calor.label}
                infierno={car.infiernoReports}
                infiernoLabel={dictionary.states.infierno.label}
                locale={locale}
              />
            </p>
          </div>
          <div className="text-right">
            <span className="block font-mono text-2xl font-semibold leading-none tabular-nums">{car.reports}</span>
            <span className="mt-1 block text-[0.68rem] font-semibold leading-none text-muted">{dictionary.explore.reportsLabel}</span>
          </div>
        </button>
      ))}
      {canToggle ? (
        <Button className="mt-1 min-h-10 py-2" onClick={() => setExpanded((current) => !current)} type="button" variant="secondary">
          {expanded ? dictionary.explore.showLess : dictionary.explore.showMore}
          <ChevronDown aria-hidden="true" className={`size-4 transition duration-200 ease-out ${expanded ? "rotate-180" : ""}`} />
        </Button>
      ) : null}
    </div>
  );
}
