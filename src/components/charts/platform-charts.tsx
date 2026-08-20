"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { CHART_TOKENS } from "@/lib/design/tokens";
import { LINE_COLORS } from "@/lib/domain/lines";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatNumber } from "@/lib/i18n/format";
import { getPlatformMessages } from "@/lib/i18n/platform-messages";
import type { PlatformDashboardData } from "@/lib/server/platform-dashboard";
import { ChartCard } from "./chart-card";

export function WorstPlatformsChartCard({
  data,
  dictionary,
  locale,
  rangeLabel,
}: {
  data: Pick<PlatformDashboardData, "platformSummaries">;
  dictionary: Dictionary;
  locale: Locale;
  rangeLabel: string;
}) {
  const messages = getPlatformMessages(locale);
  const rows = data.platformSummaries
    .filter((platform) => platform.heatReports > 0)
    .slice(0, 10)
    .map((platform) => ({
      ...platform,
      label: `${platform.stationName} · ${platform.line}`,
    }));

  return (
    <ChartCard
      dictionary={dictionary}
      id="worst-platforms"
      rangeLabel={rangeLabel}
      takeaway={messages.explore.worstPlatformsTakeaway}
      title={messages.explore.worstPlatforms}
    >
      {rows.length === 0 ? (
        <EmptyPlatformChart message={messages.explore.noPlatformReports} />
      ) : (
        <div style={{ height: Math.max(260, rows.length * 38) }}>
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis axisLine={false} allowDecimals={false} tickLine={false} type="number" />
              <YAxis
                axisLine={false}
                dataKey="label"
                interval={0}
                tick={{ fontSize: 11 }}
                tickLine={false}
                type="category"
                width={150}
              />
              <Tooltip
                content={<PlatformTooltip labelName={messages.explore.heatReports} locale={locale} />}
                cursor={{ fill: "var(--surface)" }}
              />
              <Bar
                animationDuration={CHART_TOKENS.animationDurationMs}
                dataKey="heatReports"
                fill="var(--heat-calor)"
                name={messages.explore.heatReports}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

export function PlatformLineHeatChartCard({
  data,
  dictionary,
  locale,
  rangeLabel,
}: {
  data: Pick<PlatformDashboardData, "platformLineSummaries">;
  dictionary: Dictionary;
  locale: Locale;
  rangeLabel: string;
}) {
  const messages = getPlatformMessages(locale);
  const rows = data.platformLineSummaries.filter((line) => line.heatReports > 0);

  return (
    <ChartCard
      dictionary={dictionary}
      id="platform-line-heat"
      rangeLabel={rangeLabel}
      takeaway={messages.explore.platformLineHeatTakeaway}
      title={messages.explore.platformLineHeat}
    >
      {rows.length === 0 ? (
        <EmptyPlatformChart message={messages.explore.noPlatformReports} />
      ) : (
        <div className={CHART_TOKENS.moduleHeightClass}>
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={rows} margin={CHART_TOKENS.compactMargin}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis axisLine={false} dataKey="line" tickLine={false} />
              <YAxis axisLine={false} allowDecimals={false} tickLine={false} />
              <Tooltip
                content={<PlatformTooltip labelName={messages.explore.heatReports} locale={locale} />}
                cursor={{ fill: "var(--surface)" }}
              />
              <Bar
                animationDuration={CHART_TOKENS.animationDurationMs}
                dataKey="heatReports"
                name={messages.explore.heatReports}
                radius={CHART_TOKENS.barRadius}
              >
                {rows.map((item) => (
                  <Cell fill={LINE_COLORS[item.line].fill} key={item.line} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
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
}: TooltipContentProps<number, string> & { labelName: string; locale: Locale }) {
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
