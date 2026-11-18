import { isAfter } from "date-fns"
import { hasCompletion, type Habit } from "@/entities/habit"
import { formatDateKey } from "@/shared/lib/date"

export type DayCellState = "done" | "pending" | "unscheduled" | "future"

// A future day can't be marked done yet; an unscheduled day (not in
// activeDays) is muted and non-interactive — both are visually distinct
// from "scheduled but not done".
export function getDayCellState(habit: Habit, date: Date, today: Date): DayCellState {
  if (isAfter(date, today)) return "future"
  if (!habit.activeDays.includes(date.getDay())) return "unscheduled"
  return hasCompletion(habit, formatDateKey(date)) ? "done" : "pending"
}

// How a tappable day circle looks (desktop table and phone week). Done = a
// solid disc of the habit's own color with a dark check, as in the approved
// mockups (owner 2026-11-18: the soft 20 % tint of the 2026-11-08 unslop pass
// looked dull).
export function getDayCellStyle(state: DayCellState, color: string) {
  const muted = state === "unscheduled" || state === "future"
  return {
    backgroundColor: state === "done" ? color : muted ? "var(--muted)" : "transparent",
    borderColor: state === "done" ? color : "var(--border)",
    color: "var(--background)",
    borderStyle: muted ? "dashed" : "solid",
    opacity: muted ? 0.6 : 1,
  } as const
}
