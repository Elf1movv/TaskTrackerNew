import { isAfter, isBefore, startOfDay } from "date-fns"
import type { Habit } from "../model/habit"
import { formatDateKey } from "@/shared/lib/date"
import { hasCompletion } from "./hasCompletion"

// Share of `habits` done on `date`, 0..1 — the brightness of one day on a year
// heat map (2026-11-16). Counts only habits scheduled that day that already
// existed then. `null` = nothing to count (no such habits, or a future day),
// which the map draws as an empty cell rather than as "0 % done".
export function getDayShare(habits: Habit[], date: Date, today: Date): number | null {
  const counts = getDayCounts(habits, date, today)
  return counts === null ? null : counts.done / counts.scheduled
}

// The same day's raw numbers — summed over a year for the "% за год" label.
export function getDayCounts(
  habits: Habit[],
  date: Date,
  today: Date,
): { done: number; scheduled: number } | null {
  if (isAfter(startOfDay(date), startOfDay(today))) return null
  const key = formatDateKey(date)
  let scheduled = 0
  let done = 0
  for (const habit of habits) {
    if (!habit.activeDays.includes(date.getDay())) continue
    if (isBefore(startOfDay(date), startOfDay(new Date(habit.createdAt)))) continue
    scheduled++
    if (hasCompletion(habit, key)) done++
  }
  return scheduled === 0 ? null : { done, scheduled }
}
