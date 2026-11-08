import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts"
import { chartAnimation } from "@/shared/ui/chart-animation"
import { numericFont } from "@/shared/lib/typography"

export interface WeeklyActivityPoint {
  label: string
  value: number
}

const tooltipContentStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
}

// A compact sparkline for tight spaces (the sidebar's ~220px column) — no
// Y-axis (there's no room for its label lane, and the point is the shape
// of the trend, not reading exact values off an axis), tooltip carries the
// exact number instead. Same flat-fill area look as
// widgets/habit-history/ui/HabitHistoryChart.tsx for visual consistency
// across the app, but this one lives in shared/ui since it's used by the
// navigation widget too, and widgets can't import each other directly
// (FSD) — see docs/BACKLOG.md's note on getHabitMonthCompletionStats for
// the same reasoning.
export function WeeklyActivityChart({
  data,
  seriesName,
}: {
  data: WeeklyActivityPoint[]
  // Same reasoning as HabitHistoryChart's own seriesName — without a
  // `name`, Recharts' tooltip falls back to the raw dataKey ("value"),
  // meaningless out of context (direct feedback, 2026-09-29).
  seriesName: string
}) {
  return (
    <div css={numericFont} className="h-16">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 10, bottom: 0, left: 10 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
            axisLine={false}
            tickLine={false}
            tickMargin={4}
            interval={0}
          />
          <Tooltip
            contentStyle={tooltipContentStyle}
            labelStyle={{ color: "var(--foreground)" }}
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            name={seriesName}
            stroke="var(--primary)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="var(--primary)"
            fillOpacity={0.08}
            {...chartAnimation()}
            dot={{ r: 2, fill: "var(--card)", stroke: "var(--primary)", strokeWidth: 1.5 }}
            activeDot={{ r: 3.5, fill: "var(--primary)", stroke: "var(--card)", strokeWidth: 1.5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
