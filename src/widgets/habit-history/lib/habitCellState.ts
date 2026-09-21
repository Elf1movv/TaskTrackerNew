import { isAfter, isBefore, isSameMonth } from "date-fns"
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
// isn't "behind" just because it isn't over), not at all for a future
// month, and not for any day before the habit was created (a habit made
// on Sept 15 has no data for Sept 1-14, or for any earlier month at all —
// that's not "0% completed", it's "didn't exist yet", which the year view
// shows as a plain empty cell rather than a 0% ring). Drives the year
// view's cell shading and its click popup — more informative than a
// binary "did every day in this month happen".
export function getMonthCompletionStats(habit: Habit, month: Date, today: Date): MonthCompletionStats {
  if (isAfter(month, today) && !isSameMonth(month, today)) return { done: 0, scheduled: 0 }

  const createdAt = new Date(habit.createdAt)
  if (isBefore(month, createdAt) && !isSameMonth(month, createdAt)) return { done: 0, scheduled: 0 }

  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const lastDay = isSameMonth(month, today) ? today.getDate() : daysInMonth
  const firstDay = isSameMonth(month, createdAt) ? createdAt.getDate() : 1

  let scheduled = 0
  let done = 0
  for (let day = firstDay; day <= lastDay; day++) {
    const date = new Date(year, monthIndex, day)
    if (!habit.activeDays.includes(date.getDay())) continue
    scheduled++
    if (habit.completedDates.includes(formatDateKey(date))) done++
  }

  return { done, scheduled }
}
