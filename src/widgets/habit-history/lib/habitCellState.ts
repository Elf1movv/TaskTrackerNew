import { isAfter, isSameMonth } from "date-fns"
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

// Share of this habit's *scheduled* days in `month` that are done, counted
// only up through today for the current month (a partially-lived month
// isn't "behind" just because it isn't over) and not at all for a future
// month. Drives the year view's cell shading — more informative than a
// binary "did every day in this month happen".
export function getMonthCompletionRatio(habit: Habit, month: Date, today: Date): number {
  if (isAfter(month, today) && !isSameMonth(month, today)) return 0

  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const lastDay = isSameMonth(month, today) ? today.getDate() : daysInMonth

  let scheduled = 0
  let done = 0
  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, monthIndex, day)
    if (!habit.activeDays.includes(date.getDay())) continue
    scheduled++
    if (habit.completedDates.includes(formatDateKey(date))) done++
  }

  return scheduled === 0 ? 0 : done / scheduled
}
