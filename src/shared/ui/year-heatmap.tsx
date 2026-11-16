import type { YearGrid } from "@/shared/lib/calendarGrid"

// A year as tiny day squares (weeks across, Monday on top) — just a picture,
// no taps: at phone width a day is ~5 px (2026-11-16 mockups). Each value is
// 0..1 (how much was done that day) or null (nothing to count: before the
// habit existed, a day off, or a future day). The brighter, the more done.
export function YearHeatmap({
  grid,
  values,
  color,
  todayIndex,
  monthLabels,
  label,
}: {
  grid: YearGrid
  values: (number | null)[]
  color: string
  // Index in grid.cells of today, if today is in this year.
  todayIndex: number
  // Labels for every month; only a few are shown so they never collide.
  monthLabels: string[]
  // Screen-reader text for the whole picture, e.g. "2026: 132 days · 61%".
  label: string
}) {
  return (
    <div role="img" aria-label={label} className="flex flex-col gap-1.5">
      <div
        className="grid gap-px"
        style={{
          gridTemplateColumns: `repeat(${grid.columns}, minmax(0, 1fr))`,
          gridTemplateRows: "repeat(7, auto)",
          gridAutoFlow: "column",
        }}
      >
        {grid.cells.map((date, i) => {
          const value = values[i]
          const background =
            date === null
              ? "transparent"
              : value === null
                ? "color-mix(in srgb, var(--muted) 45%, transparent)"
                : value === 0
                  ? "var(--muted)"
                  : `color-mix(in srgb, ${color} ${Math.round(35 + 65 * value)}%, var(--muted))`
          return (
            <span
              key={i}
              className="aspect-square rounded-[1px]"
              style={{
                background,
                outline: i === todayIndex ? "1px solid var(--primary)" : undefined,
              }}
            />
          )
        })}
      </div>
      <div className="relative h-3 text-[10px] leading-3 text-tertiary" aria-hidden>
        {[0, 3, 6, 9].map(month => (
          <span
            key={month}
            className="absolute"
            style={{ left: `${(grid.monthColumns[month] / grid.columns) * 100}%` }}
          >
            {monthLabels[month]}
          </span>
        ))}
      </div>
    </div>
  )
}
