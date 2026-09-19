import { eachDayOfInterval, endOfMonth, getDay, startOfMonth } from "date-fns"

export interface MonthGrid {
  days: Date[]
  startPad: number
}

export function buildMonthGrid(month: Date): MonthGrid {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  return {
    days: eachDayOfInterval({ start: monthStart, end: monthEnd }),
    // getDay() is Sunday-first (0=Sun); shift so Monday lands in column 0,
    // matching WEEKDAY_LABELS in dateLocale.ts.
    startPad: (getDay(monthStart) + 6) % 7,
  }
}
