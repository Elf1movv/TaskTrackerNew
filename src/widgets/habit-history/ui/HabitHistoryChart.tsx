import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { monoFont } from "@/shared/lib/typography"
import type { ChartPoint } from "../lib/habitHistorySummary"

export function HabitHistoryChart({ data }: { data: ChartPoint[] }) {
  return (
    <div css={monoFont} className="h-36 -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="habitHistoryFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, "dataMax"]}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={24}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            }}
            labelStyle={{ color: "var(--foreground)" }}
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--primary)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#habitHistoryFill)"
            dot={{ r: 2.5, fill: "var(--card)", stroke: "var(--primary)", strokeWidth: 2 }}
            activeDot={{ r: 4.5, fill: "var(--primary)", stroke: "var(--card)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
