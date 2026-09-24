import {
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
