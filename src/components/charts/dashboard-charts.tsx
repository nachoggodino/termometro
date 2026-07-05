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
import type { DashboardData } from "@/lib/domain/dashboard";
import { LINE_COLORS } from "@/lib/domain/lines";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { ChartCard } from "./chart-card";

const heatColors = {
  fresco: "var(--heat-fresco)",
  calor: "var(--heat-calor)",
  infierno: "var(--heat-infierno)",
};

const animationDuration = 220;

export function DashboardCharts({
  data,
  dictionary,
  rangeLabel,
}: {
  data: DashboardData;
  dictionary: Dictionary;
  rangeLabel: string;
}) {
  const topLines = data.lineSummaries.slice(0, 6);

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
        <div className="h-64">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={topLines} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis dataKey="score" domain={[0, 100]} hide type="number" />
              <YAxis axisLine={false} dataKey="line" tickLine={false} type="category" width={36} />
              <Tooltip cursor={{ fill: "var(--surface)" }} />
              <Bar animationDuration={animationDuration} dataKey="score" radius={[0, 6, 6, 0]}>
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
        <div className="h-56">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={data.trend} margin={{ left: -24, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis axisLine={false} dataKey="label" tickLine={false} />
              <YAxis axisLine={false} domain={[0, 100]} tickLine={false} />
              <Tooltip />
              <Line animationDuration={animationDuration} dataKey="score" dot={{ r: 3 }} stroke="var(--heat-infierno)" strokeWidth={2} type="monotone" />
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
        <div className="h-56">
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={topLines} margin={{ left: -24, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis axisLine={false} dataKey="line" tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Area animationDuration={animationDuration} dataKey="reports" fill="var(--heat-calor-soft)" stroke="var(--heat-calor)" type="monotone" />
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
                  <span className="font-mono text-sm font-semibold">{car.car}</span>
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
