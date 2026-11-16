import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  getDay,
  getDaysInYear,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns"

export interface MonthGridDay {
  date: Date
  isCurrentMonth: boolean
}

// Moved here from widgets/calendar-grid/lib (2026-09-24, the multi-view
// calendar feature) — the Year view needs this exact same month-grid math
// for its 12 mini-months, and a widget-to-widget import (calendar-year →
// calendar-grid) isn't legal FSD layering. This is pure date math with no
// UI/entity dependency, which is exactly what belongs in `shared/lib`.
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

// The Week view's 7 days, Monday-first — simpler than buildMonthGrid, no
// leading/trailing padding needed since a week is always exactly 7 days.
export function buildWeekRange(anchor: Date): Date[] {
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 })
  return eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })
}

// The Agenda view's flat forward-looking window — a fixed number of days,
// not infinite scroll (see docs/requirements/04. Calendar for why: this is
// a personal single-user tracker, and infinite scroll's extra engineering
// — intersection observers, incremental range extension, scroll-position
// preservation across refetches — isn't proportionate to the actual
// benefit here).
export function buildAgendaRange(anchor: Date, days = 30): Date[] {
  return eachDayOfInterval({ start: anchor, end: addDays(anchor, days - 1) })
}

export interface YearGrid {
  // Column-major, Monday-first: cells[col * 7 + row]. `null` pads the first
  // week before January 1 and the last week after December 31.
  cells: (Date | null)[]
  columns: number
  // Column where each month starts — for the month labels under the grid.
  monthColumns: number[]
}

// A whole calendar year as a "weeks × weekdays" grid — the year heat maps on
// the habits page (collapsed block) and on the habit screen (2026-11-16).
export function buildYearGrid(year: number): YearGrid {
  const jan1 = new Date(year, 0, 1)
  const lead = (jan1.getDay() + 6) % 7
  const days = getDaysInYear(jan1)
  const columns = Math.ceil((lead + days) / 7)
  const cells: (Date | null)[] = []
  for (let i = 0; i < columns * 7; i++) {
    const offset = i - lead
    cells.push(offset >= 0 && offset < days ? addDays(jan1, offset) : null)
  }
  const monthColumns = Array.from({ length: 12 }, (_, month) => {
    const dayOfYear = Math.round((new Date(year, month, 1).getTime() - jan1.getTime()) / 86_400_000)
    return Math.floor((lead + dayOfYear) / 7)
  })
  return { cells, columns, monthColumns }
}
