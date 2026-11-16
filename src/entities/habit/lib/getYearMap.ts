import { isSameDay } from "date-fns"
import type { Habit } from "../model/habit"
import { buildYearGrid, type YearGrid } from "@/shared/lib/calendarGrid"
import { getDayCounts } from "./getDayShare"

export interface YearMap {
  grid: YearGrid
  // One value per grid cell: share done that day (0..1) or null.
  values: (number | null)[]
  todayIndex: number
  // Totals over the year so far: habit-days done / scheduled, and the number
  // of days with at least one habit done.
  done: number
  scheduled: number
  activeDays: number
}

// Everything a year heat map needs, for one habit or a whole block
// (2026-11-16: collapsed block on the phone, the habit screen).
export function getYearMap(habits: Habit[], year: number, today: Date): YearMap {
  const grid = buildYearGrid(year)
  let done = 0
  let scheduled = 0
  let activeDays = 0
  let todayIndex = -1
  const values = grid.cells.map((date, i) => {
    if (date === null) return null
    if (isSameDay(date, today)) todayIndex = i
    const counts = getDayCounts(habits, date, today)
    if (counts === null) return null
    done += counts.done
    scheduled += counts.scheduled
    if (counts.done > 0) activeDays++
    return counts.done / counts.scheduled
  })
  return { grid, values, todayIndex, done, scheduled, activeDays }
}
