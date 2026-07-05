"use client";

import {
  Area,
  AreaChart,
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
} from "recharts";
import { DASHBOARD_LIMITS, type DashboardData } from "@/lib/domain/dashboard";
import { CHART_TOKENS } from "@/lib/design/tokens";
import { LINE_COLORS } from "@/lib/domain/lines";
import { formatCarCode } from "@/lib/domain/reports";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { ChartCard } from "./chart-card";

const heatColors = {
  fresco: "var(--heat-fresco)",
  calor: "var(--heat-calor)",
  infierno: "var(--heat-infierno)",
};

export function DashboardCharts({
  data,
  dictionary,
  rangeLabel,
}: {
  data: DashboardData;
  dictionary: Dictionary;
  rangeLabel: string;
}) {
  const topLines = data.lineSummaries.slice(0, DASHBOARD_LIMITS.topLineCount);

  return (
    <div className="flex flex-col gap-4">
      <ChartCard
        caveat={dictionary.explore.caveats.confidence}
        dictionary={dictionary}
        help={dictionary.explore.scoreHelp}
        rangeLabel={rangeLabel}
        takeaway={dictionary.explore.chartTakeaways.ranking}
        title={dictionary.explore.modules.ranking}
      >
        <div className={CHART_TOKENS.rankingHeightClass}>
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={topLines} layout="vertical" margin={CHART_TOKENS.rankingMargin}>
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis dataKey="score" domain={CHART_TOKENS.heatScoreDomain} hide type="number" />
              <YAxis axisLine={false} dataKey="line" tickLine={false} type="category" width={CHART_TOKENS.yAxisLineWidth} />
              <Tooltip cursor={{ fill: "var(--surface)" }} />
              <Bar animationDuration={CHART_TOKENS.animationDurationMs} dataKey="score" radius={CHART_TOKENS.barRadius}>
                {topLines.map((item) => (
                  <Cell fill={heatColors[item.tone]} key={item.line} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        caveat={dictionary.explore.caveats.confidence}
        dictionary={dictionary}
        help={dictionary.explore.scoreHelp}
        rangeLabel={rangeLabel}
        takeaway={dictionary.explore.chartTakeaways.trend}
        title={dictionary.explore.modules.trend}
      >
        <div className={CHART_TOKENS.moduleHeightClass}>
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={data.trend} margin={CHART_TOKENS.compactMargin}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis axisLine={false} dataKey="label" tickLine={false} />
              <YAxis axisLine={false} domain={CHART_TOKENS.heatScoreDomain} tickLine={false} />
              <Tooltip />
              <Line animationDuration={CHART_TOKENS.animationDurationMs} dataKey="score" dot={{ r: 3 }} stroke="var(--heat-infierno)" strokeWidth={2} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        caveat={dictionary.explore.caveats.confidence}
        dictionary={dictionary}
        rangeLabel={rangeLabel}
        takeaway={dictionary.explore.chartTakeaways.volume}
        title={dictionary.explore.modules.volume}
      >
        <div className={CHART_TOKENS.moduleHeightClass}>
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={topLines} margin={CHART_TOKENS.compactMargin}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis axisLine={false} dataKey="line" tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Area animationDuration={CHART_TOKENS.animationDurationMs} dataKey="reports" fill="var(--heat-calor-soft)" stroke="var(--heat-calor)" type="monotone" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        caveat={dictionary.explore.caveats.confidence}
        dictionary={dictionary}
        rangeLabel={rangeLabel}
        takeaway={dictionary.explore.chartTakeaways.worstCars}
        title={dictionary.explore.modules.worstCars}
      >
        <div className="flex flex-col gap-2">
          {data.worstCars.map((car) => (
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border border-border bg-background p-3" key={`${car.line}-${car.car}`}>
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
                  {car.reports} · {dictionary.common.confidence} {dictionary.common[car.confidence]}
                </p>
              </div>
              <span className="font-mono text-lg font-semibold">{car.score}</span>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
