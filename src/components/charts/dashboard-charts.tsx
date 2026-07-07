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
import { DASHBOARD_LIMITS, type DashboardData } from "@/lib/domain/dashboard";
import { CHART_TOKENS } from "@/lib/design/tokens";
import { LINE_COLORS, type MetroLine } from "@/lib/domain/lines";
import type { TimeRange } from "@/lib/domain/ranges";
import { formatCarCode } from "@/lib/domain/reports";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { ChartCard } from "./chart-card";

export function DashboardCharts({
  data,
  dictionary,
  rangeLabel,
  selectedRange,
  selectedLines,
}: {
  data: DashboardData;
  dictionary: Dictionary;
  rangeLabel: string;
  selectedRange: TimeRange;
  selectedLines: MetroLine[];
}) {
  const visibleLines = data.lineSummaries.filter((summary) => (selectedLines.length > 0 ? selectedLines.includes(summary.line) : summary.reports > 0));
  const limitWhenUnfiltered = (items: typeof visibleLines) => (selectedLines.length > 0 ? items : items.slice(0, DASHBOARD_LIMITS.topLineCount));
  const reportVolumeLines = limitWhenUnfiltered(visibleLines.toSorted((a, b) => b.reports - a.reports || b.score - a.score));
  const carLines = limitWhenUnfiltered(visibleLines.toSorted((a, b) => b.carsReported - a.carsReported || b.score - a.score));
  const lineEvolutionLines = selectedLines.length > 0 ? selectedLines : data.lineSummaries.map((summary) => summary.line);
  const xAxisInterval = selectedRange === "today" ? 2 : selectedRange === "sevenDays" ? 0 : "preserveStartEnd";

  return (
    <div className="flex flex-col gap-4">
      <ChartCard
        dictionary={dictionary}
        help={dictionary.explore.fleetAdjustedScoreHelp}
        rangeLabel={rangeLabel}
        takeaway={dictionary.explore.chartTakeaways.lineEvolution}
        title={dictionary.explore.modules.trend}
      >
        <div className={CHART_TOKENS.moduleHeightClass}>
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={data.lineEvolution} margin={CHART_TOKENS.compactMargin}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis axisLine={false} dataKey="label" interval={xAxisInterval} tickLine={false} />
              <YAxis axisLine={false} domain={CHART_TOKENS.heatScoreDomain} tickLine={false} />
              <Tooltip content={<LocalizedTooltip footer={dictionary.explore.fleetAdjustedScoreHelp} labelName={dictionary.explore.fleetAdjustedScoreLabel} />} />
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
        <LineLegend lines={lineEvolutionLines} />
      </ChartCard>

      <ChartCard
        dictionary={dictionary}
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
              <Tooltip content={<LocalizedTooltip labelName={dictionary.common.reports} />} cursor={{ fill: "var(--surface)" }} />
              <Bar animationDuration={CHART_TOKENS.animationDurationMs} dataKey="reports" name={dictionary.common.reports} radius={[6, 6, 0, 0]}>
                {reportVolumeLines.map((item) => (
                  <Cell fill={LINE_COLORS[item.line].fill} key={item.line} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        dictionary={dictionary}
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
              <Tooltip content={<LocalizedTooltip labelName={dictionary.explore.carsReportedLabel} />} cursor={{ fill: "var(--surface)" }} />
              <Bar animationDuration={CHART_TOKENS.animationDurationMs} dataKey="carsReported" name={dictionary.explore.carsReportedLabel} radius={[6, 6, 0, 0]}>
                {carLines.map((item) => (
                  <Cell fill={LINE_COLORS[item.line].fill} key={item.line} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        dictionary={dictionary}
        rangeLabel={rangeLabel}
        takeaway={dictionary.explore.chartTakeaways.worstCars}
        title={dictionary.explore.modules.worstCars}
      >
        <WorstCarsList data={data} dictionary={dictionary} />
      </ChartCard>

    </div>
  );
}

function LocalizedTooltip({
  active,
  payload,
  label,
  labelName,
  footer,
}: Partial<TooltipContentProps<number, string>> & {
  labelName: string;
  footer?: string;
}) {
  if (!active || !payload?.length) return null;
  const visiblePayload = payload
    .filter((item) => typeof item.value === "number")
    .toSorted((a, b) => Number(b.value) - Number(a.value))
    .slice(0, 8);

  return (
    <div className="max-w-64 rounded-md border border-border bg-surface-raised px-3 py-2 text-xs text-foreground shadow-[var(--shadow-popover)]">
      <p className="mb-2 font-semibold">{label}</p>
      <div className="flex flex-col gap-1">
        {visiblePayload.map((item) => (
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2" key={`${item.name}-${item.dataKey}`}>
            <span aria-hidden="true" className="size-2 rounded-full" style={{ background: item.color }} />
            <span className="text-muted">{String(item.name ?? labelName)}</span>
            <span className="font-mono font-semibold tabular-nums">{Number(item.value)}</span>
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

function WorstCarsList({ data, dictionary }: { data: DashboardData; dictionary: Dictionary }) {
  if (data.worstCars.length === 0) {
    return <p className="rounded-md bg-surface p-3 text-sm text-muted">{dictionary.explore.noRecentReport}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {data.worstCars.map((car) => (
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border border-border bg-surface p-3" key={`${car.line}-${car.car}`}>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="rounded-sm px-1.5 py-1 text-xs font-bold"
                style={{
                  background: LINE_COLORS[car.line].fill,
                  color: LINE_COLORS[car.line].textOnFill,
                }}
              >
                {car.line}
              </span>
              <span className="font-mono text-sm font-semibold">{formatCarCode(car.car)}</span>
            </div>
            <p className="mt-1 text-xs text-muted">
              {dictionary.explore.score}: <span className="font-mono font-semibold text-foreground">{car.score}</span> · {dictionary.common.confidence} {dictionary.common[car.confidence]}
            </p>
          </div>
          <div className="text-right">
            <span className="block font-mono text-2xl font-semibold leading-none tabular-nums">{car.reports}</span>
            <span className="mt-1 block text-[0.68rem] font-semibold leading-none text-muted">{dictionary.explore.reportsLabel}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
