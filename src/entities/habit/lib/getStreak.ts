import { addDays } from "date-fns"
import { formatDateKey } from "@/shared/lib/date"

// `activeDays` — JS `Date.getDay()` values this habit is scheduled on. A
// day outside that schedule is skipped when walking backward (doesn't
// count, but doesn't break the streak either) rather than treated like a
// missed day — a "Mon/Wed/Fri" habit shouldn't lose its streak over a
// Tuesday it was never supposed to happen on.
export function getStreak(dates: string[], activeDays: number[]): number {
  const set = new Set(dates)
  const scheduled = new Set(activeDays)
  if (scheduled.size === 0) return 0

  let streak = 0
  let day = new Date()

  if (scheduled.has(day.getDay()) && set.has(formatDateKey(day))) {
    streak = 1
  }
  day = addDays(day, -1)

  // Capped, not an unbounded while(true) — scheduled is guaranteed
  // non-empty above, so this always terminates in practice well under the
  // cap, but a hard limit keeps a future change to this function from
  // being able to hang the tab on bad data.
  for (let i = 0; i < 3650; i++) {
    if (!scheduled.has(day.getDay())) {
      day = addDays(day, -1)
      continue
    }
    if (!set.has(formatDateKey(day))) break
    streak++
    day = addDays(day, -1)
  }

  return streak
}
