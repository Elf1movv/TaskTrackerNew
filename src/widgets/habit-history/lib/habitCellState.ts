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

export interface MonthCompletionStats {
  done: number
  scheduled: number
}

// This habit's *scheduled* days in `month` that are done vs. total, counted
// only up through today for the current month (a partially-lived month
// isn't "behind" just because it isn't over) and not at all for a future
// month. Drives the year view's cell shading and its click popup — more
// informative than a binary "did every day in this month happen".
export function getMonthCompletionStats(habit: Habit, month: Date, today: Date): MonthCompletionStats {
  if (isAfter(month, today) && !isSameMonth(month, today)) return { done: 0, scheduled: 0 }

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

  return { done, scheduled }
}
