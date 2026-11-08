import {
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns"

export type HabitHistoryPeriod = "week" | "month" | "year"

// Monday-first, matching the rest of the app (see
// shared/lib/calendarGrid.ts's buildMonthGrid).
export function getPeriodDays(period: "week" | "month", today: Date): Date[] {
  if (period === "week") {
    return eachDayOfInterval({
      start: startOfWeek(today, { weekStartsOn: 1 }),
      end: endOfWeek(today, { weekStartsOn: 1 }),
    })
  }
  return eachDayOfInterval({ start: startOfMonth(today), end: endOfMonth(today) })
}

export function getYearMonths(today: Date): Date[] {
  return eachMonthOfInterval({ start: startOfYear(today), end: endOfYear(today) })
}

// Browsing past periods on /habits (owner feedback 2026-11-08). `anchor` is
// any date inside the shown period; "now" stays a separate real `today`
// everywhere else, so days after the anchor aren't mistaken for future days.
export function shiftPeriodAnchor(period: HabitHistoryPeriod, anchor: Date, direction: -1 | 1): Date {
  if (period === "week") return addWeeks(anchor, direction)
  if (period === "month") return addMonths(anchor, direction)
  return addYears(anchor, direction)
}

// Can't browse past the period that contains today — nothing to mark there.
export function isCurrentOrFuturePeriod(period: HabitHistoryPeriod, anchor: Date, today: Date): boolean {
  if (period === "week")
    return startOfWeek(anchor, { weekStartsOn: 1 }) >= startOfWeek(today, { weekStartsOn: 1 })
  if (period === "month") return startOfMonth(anchor) >= startOfMonth(today)
  return startOfYear(anchor) >= startOfYear(today)
}
