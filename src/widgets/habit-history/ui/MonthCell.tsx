import type { Habit } from "@/entities/habit"
import { getMonthCompletionRatio } from "../lib/habitCellState"

// Year view — shaded by completion share rather than a binary fill, so
// "half the scheduled days done this month" actually looks different from
// "none" or "all".
export function MonthCell({ habit, month, today }: { habit: Habit; month: Date; today: Date }) {
  const ratio = getMonthCompletionRatio(habit, month, today)

  return (
    <div
      aria-label={`${habit.title} ${month.toISOString().slice(0, 7)}: ${Math.round(ratio * 100)}%`}
      className="size-8 rounded-md border"
      style={{
        backgroundColor: ratio > 0 ? habit.color : "transparent",
        opacity: ratio > 0 ? 0.25 + ratio * 0.75 : 1,
        borderColor: ratio > 0 ? habit.color : "var(--border)",
      }}
    />
  )
}
