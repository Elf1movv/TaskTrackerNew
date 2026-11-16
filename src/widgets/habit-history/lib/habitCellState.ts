import { isAfter } from "date-fns"
import type { Habit } from "@/entities/habit"
import { formatDateKey } from "@/shared/lib/date"

export type DayCellState = "done" | "pending" | "unscheduled" | "future"

// A future day can't be marked done yet; an unscheduled day (not in
// activeDays) is muted and non-interactive — both are visually distinct
// from "scheduled but not done".
export function getDayCellState(habit: Habit, date: Date, today: Date): DayCellState {
  if (isAfter(date, today)) return "future"
  if (!habit.activeDays.includes(date.getDay())) return "unscheduled"
  return habit.completedDates.includes(formatDateKey(date)) ? "done" : "pending"
}

// How a tappable day circle looks (desktop table and phone week, 2026-11-16).
// Done = a soft tint of the habit's own color + a check, not a solid disc
// (unslop pass 2026-11-08: four habits a week read as a rainbow mosaic).
export function getDayCellStyle(state: DayCellState, color: string) {
  const muted = state === "unscheduled" || state === "future"
  return {
    backgroundColor:
      state === "done"
        ? `color-mix(in srgb, ${color} 20%, transparent)`
        : muted
          ? "var(--muted)"
          : "transparent",
    borderColor: state === "done" ? color : "var(--border)",
    color,
    borderStyle: muted ? "dashed" : "solid",
    opacity: muted ? 0.6 : 1,
  } as const
}
