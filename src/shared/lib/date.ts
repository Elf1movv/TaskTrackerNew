import { addDays, eachDayOfInterval, format, subDays } from "date-fns"

export const DATE_KEY_FORMAT = "yyyy-MM-dd"

export function formatDateKey(date: Date): string {
  return format(date, DATE_KEY_FORMAT)
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
