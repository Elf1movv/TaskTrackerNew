import { describe, expect, it } from "vitest"
import { buildAgendaRange, buildMonthGrid, buildWeekRange } from "./calendarGrid"

describe("buildMonthGrid", () => {
  it("pads September 2026 (starts on a Tuesday) to a Monday-first, full-week grid", () => {
    const grid = buildMonthGrid(new Date("2026-09-15"))

    // 1 leading day (Mon Aug 31) + 30 days of September + 4 trailing days
    // (Oct 1-4) = 35, a multiple of 7.
    expect(grid).toHaveLength(35)
    expect(grid[0].date.toDateString()).toBe(new Date("2026-08-31").toDateString())
    expect(grid[0].isCurrentMonth).toBe(false)
    expect(grid[grid.length - 1].date.toDateString()).toBe(new Date("2026-10-04").toDateString())
    expect(grid[grid.length - 1].isCurrentMonth).toBe(false)

    const currentMonthDays = grid.filter(d => d.isCurrentMonth)
    expect(currentMonthDays).toHaveLength(30)
    expect(currentMonthDays[0].date.toDateString()).toBe(new Date("2026-09-01").toDateString())
    expect(currentMonthDays[currentMonthDays.length - 1].date.toDateString()).toBe(
      new Date("2026-09-30").toDateString(),
    )
  })

  it("always returns a length that's a multiple of 7, whatever month/weekday it starts on", () => {
    for (let month = 0; month < 12; month++) {
      const grid = buildMonthGrid(new Date(2026, month, 10))
      expect(grid.length % 7).toBe(0)
    }
  })
})

describe("buildWeekRange", () => {
  it("returns exactly 7 consecutive days, Monday-first, for any anchor day in that week", () => {
    // Thursday Sept 24 2026 — week should be Mon 21 through Sun 27.
    const week = buildWeekRange(new Date("2026-09-24"))
    expect(week).toHaveLength(7)
    expect(week[0].toDateString()).toBe(new Date("2026-09-21").toDateString())
    expect(week[week.length - 1].toDateString()).toBe(new Date("2026-09-27").toDateString())
  })

  it("gives the same week regardless of which day of that week is the anchor", () => {
    const fromMonday = buildWeekRange(new Date("2026-09-21"))
    const fromSunday = buildWeekRange(new Date("2026-09-27"))
    expect(fromMonday.map(d => d.toDateString())).toEqual(fromSunday.map(d => d.toDateString()))
  })
})

describe("buildAgendaRange", () => {
  it("returns a 30-day forward window starting at the anchor by default", () => {
    const range = buildAgendaRange(new Date("2026-09-24"))
    expect(range).toHaveLength(30)
    expect(range[0].toDateString()).toBe(new Date("2026-09-24").toDateString())
    expect(range[range.length - 1].toDateString()).toBe(new Date("2026-10-23").toDateString())
  })

  it("respects a custom window size", () => {
    expect(buildAgendaRange(new Date("2026-09-24"), 5)).toHaveLength(5)
  })
})
