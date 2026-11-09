import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { chartAnimation } from "@/shared/ui/chart-animation"
import type { ChartPoint } from "../lib/habitHistorySummary"

// Three styles the user asked to try side by side, switched via
// HabitHistoryGrid's toggle row — "area" (the original smooth trend) is
// the default. A fourth, "ring" (a single donut with the period's overall
// percent), was tried and dropped 2026-09-23 — direct feedback called it
// unclear/hard to read, not worth keeping alongside the three trend styles.
export type HabitChartStyle = "area" | "bar" | "step"

const tooltipContentStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
}

// Shared by all three styles — only the plotted series itself
// (Area/Bar/Line) differs between them. Returns an array, NOT a
// wrapping component: Recharts' generateCategoricalChart reads
// CartesianGrid/XAxis/YAxis/Tooltip by walking the chart's OWN direct
// children, so a custom component wrapping them (e.g. a `<ChartAxes />`
// this used to be) is invisible to it — axes/grid/tooltip silently fail to render, and
// worse, the Y domain never gets registered, so Bar/Line series
// compute wrong pixel heights (a real bug this caused, caught in
// 2026-09-27 QA — see docs/BACKLOG.md). Spreading this array directly
// as `{chartAxes()}` keeps every style's axis config in one place
// without hitting that limitation.
function chartAxes() {
  return [
    <CartesianGrid key="grid" vertical={false} stroke="var(--border)" strokeOpacity={0.7} />,
    <XAxis
      key="x"
      dataKey="label"
      tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
      axisLine={false}
      tickLine={false}
      tickMargin={8}
    />,
    <YAxis
      key="y"
      allowDecimals={false}
      domain={[0, "dataMax"]}
      tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
      axisLine={false}
      tickLine={false}
      width={24}
    />,
    <Tooltip
      key="tooltip"
      contentStyle={tooltipContentStyle}
      labelStyle={{ color: "var(--foreground)" }}
      cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
    />,
  ]
}

export function HabitHistoryChart({
  data,
  style,
  seriesName,
}: {
  data: ChartPoint[]
  style: HabitChartStyle
  // Recharts' tooltip falls back to the raw `dataKey` ("value") as the
  // series label when no `name` is given — meaningless to someone reading
  // the tooltip, since "value" isn't a term used anywhere else in the app.
  // The caller passes the same "Выполнено"/"Done" label already shown
  // right below this chart (habits.page.summaryLabel), so the tooltip
  // reads "Выполнено: 2" instead of "value : 2" (direct feedback,
  // 2026-09-29).
  seriesName: string
}) {
  if (style === "bar") {
    return (
      <div className="tabular-nums h-36 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
            {chartAxes()}
            <Bar
              dataKey="value"
              name={seriesName}
              fill="var(--primary)"
              radius={[4, 4, 0, 0]}
              {...chartAnimation()}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (style === "step") {
    return (
      <div className="tabular-nums h-36 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
            {chartAxes()}
            <Line
              type="stepAfter"
              dataKey="value"
              {...chartAnimation()}
              name={seriesName}
              stroke="var(--primary)"
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: "var(--card)", stroke: "var(--primary)", strokeWidth: 2 }}
              activeDot={{ r: 4.5, fill: "var(--primary)", stroke: "var(--card)", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="tabular-nums h-36 -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
          {chartAxes()}
          <Area
            type="monotone"
            dataKey="value"
            name={seriesName}
            stroke="var(--primary)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="var(--primary)"
            fillOpacity={0.08}
            {...chartAnimation()}
            dot={{ r: 2.5, fill: "var(--card)", stroke: "var(--primary)", strokeWidth: 2 }}
            activeDot={{ r: 4.5, fill: "var(--primary)", stroke: "var(--card)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
