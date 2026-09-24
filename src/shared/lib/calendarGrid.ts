import { addDays, eachDayOfInterval, endOfMonth, getDay, startOfMonth, startOfWeek, subDays } from "date-fns"

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
