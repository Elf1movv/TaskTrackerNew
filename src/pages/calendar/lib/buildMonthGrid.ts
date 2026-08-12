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
    startPad: getDay(monthStart),
  }
}
