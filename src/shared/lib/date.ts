import { addDays, eachDayOfInterval, subDays } from "date-fns"

export const DATE_KEY_FORMAT = "yyyy-MM-dd"

// Same "yyyy-MM-dd" as DATE_KEY_FORMAT, built by hand: the habit year views
// call this thousands of times, and date-fns `format` re-reads the pattern on
// every call (speed iteration 2026-11-18).
export function formatDateKey(date: Date): string {
  const m = date.getMonth() + 1
  const d = date.getDate()
  return `${date.getFullYear()}-${m < 10 ? "0" : ""}${m}-${d < 10 ? "0" : ""}${d}`
}

export function getTodayKey(): string {
  return formatDateKey(new Date())
}

// Overdue, due today, or due tomorrow — "yyyy-MM-dd" keys compare
// correctly as plain strings, so this is just a bounds check against
// tomorrow's key.
export function isDueSoonOrOverdue(dateKey: string | null): boolean {
  if (!dateKey) return false
  return dateKey <= formatDateKey(addDays(new Date(), 1))
}

// JS `Date.getDay()` values (0=Sunday..6=Saturday), in the Monday-first
// order this app displays weekdays in everywhere else (see
// shared/lib/calendarGrid.ts's buildMonthGrid).
export const MONDAY_FIRST_WEEKDAYS = [1, 2, 3, 4, 5, 6, 0]

// A rolling window (not the current calendar week) — always `n` points
// ending on `referenceDate`, oldest first. Distinct on purpose from
// widgets/habit-history's getPeriodDays("week", …), which is the current
// Mon-Sun calendar week and can be a single point on a Monday.
export function getLastNDays(n: number, referenceDate: Date): Date[] {
  return eachDayOfInterval({ start: subDays(referenceDate, n - 1), end: referenceDate })
}
