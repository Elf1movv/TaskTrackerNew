import { isAfter, isBefore, isSameMonth } from "date-fns"
import type { Habit } from "../model/habit"
import { formatDateKey } from "@/shared/lib/date"

export interface HabitMonthCompletionStats {
  done: number
  scheduled: number
}

// Lives here (not in widgets/habit-history, which originally had this) so
// the Year view (widgets/calendar-year) can reuse it too, without an
// FSD-forbidden widget-to-widget import — both widgets depend on this
// entity instead, neither on the other.
//
// This habit's *scheduled* days in `month` that are done vs. total,
// counted only up through today for the current month (a partially-lived
// month isn't "behind" just because it isn't over), not at all for a
// future month, and not for any day before the habit was created (a habit
// made on Sept 15 has no data for Sept 1-14, or for any earlier month at
// all — that's not "0% completed", it's "didn't exist yet", which callers
// show as a plain empty/excluded state rather than a 0% ring).
export function getHabitMonthCompletionStats(
  habit: Habit,
  month: Date,
  today: Date,
): HabitMonthCompletionStats {
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
