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
