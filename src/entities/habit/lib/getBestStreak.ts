import { addDays, isAfter, startOfDay } from "date-fns"
import { formatDateKey } from "@/shared/lib/date"

// The longest run of done scheduled days ever — the "лучшая серия" number on
// the habit screen (2026-11-16). Same rules as getStreak: a day outside
// `activeDays` neither counts nor breaks the run, and today not being done
// yet doesn't break it either (the day isn't over).
export function getBestStreak(dates: string[], activeDays: number[], today = new Date()): number {
  const scheduled = new Set(activeDays)
  if (scheduled.size === 0 || dates.length === 0) return 0
  const done = new Set(dates)
  const first = [...dates].sort()[0]
  const [y, m, d] = first.split("-").map(Number)
  const end = startOfDay(today)

  let best = 0
  let run = 0
  let day = new Date(y, m - 1, d)
  // Capped like getStreak — ten years of days is far more than any real data.
  for (let i = 0; i < 3660 && !isAfter(day, end); i++, day = addDays(day, 1)) {
    if (!scheduled.has(day.getDay())) continue
    if (done.has(formatDateKey(day))) {
      run++
      if (run > best) best = run
    } else if (formatDateKey(day) !== formatDateKey(end)) {
      run = 0
    }
  }
  return best
}
