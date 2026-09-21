import { addDays, eachDayOfInterval, endOfMonth, getDay, startOfMonth, subDays } from "date-fns"

export interface MonthGridDay {
  date: Date
  isCurrentMonth: boolean
}

export function buildMonthGrid(month: Date): MonthGridDay[] {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  // getDay() is Sunday-first (0=Sun); shift so Monday lands in column 0,
  // matching WEEKDAY_LABELS in dateLocale.ts.
  const startPad = (getDay(monthStart) + 6) % 7
  const currentDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const leadingDays = Array.from({ length: startPad }, (_, i) => subDays(monthStart, startPad - i))
  // Pad the tail so the grid always ends on a full row of 7 — shows the
  // start of next month instead of cutting off mid-week.
  const trailingCount = (7 - ((leadingDays.length + currentDays.length) % 7)) % 7
  const trailingDays = Array.from({ length: trailingCount }, (_, i) => addDays(monthEnd, i + 1))

  return [
    ...leadingDays.map(date => ({ date, isCurrentMonth: false })),
    ...currentDays.map(date => ({ date, isCurrentMonth: true })),
    ...trailingDays.map(date => ({ date, isCurrentMonth: false })),
  ]
}
