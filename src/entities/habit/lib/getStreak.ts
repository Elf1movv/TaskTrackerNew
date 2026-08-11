import { addDays } from "date-fns"
import { formatDateKey } from "@/shared/lib/date"

export function getStreak(dates: string[]): number {
  const set = new Set(dates)
  let streak = 0
  let day = new Date()

  if (set.has(formatDateKey(day))) {
    streak = 1
  }
  day = addDays(day, -1)

  while (set.has(formatDateKey(day))) {
    streak++
    day = addDays(day, -1)
  }

  return streak
}
