import { describe, expect, it } from "vitest"
import { isCurrentOrFuturePeriod, shiftPeriodAnchor } from "./periodColumns"
import { getHabitHistorySummary } from "./habitHistorySummary"

const today = new Date(2026, 10, 8) // 8 Nov 2026

describe("period navigation", () => {
  it("steps back a month and refuses to go past the current period", () => {
    const prev = shiftPeriodAnchor("month", today, -1)
    expect(prev.getMonth()).toBe(9)
    expect(isCurrentOrFuturePeriod("month", prev, today)).toBe(false)
    expect(isCurrentOrFuturePeriod("month", today, today)).toBe(true)
    expect(isCurrentOrFuturePeriod("week", shiftPeriodAnchor("week", today, -1), today)).toBe(false)
    expect(isCurrentOrFuturePeriod("year", shiftPeriodAnchor("year", today, -1), today)).toBe(false)
  })
})

describe("habit summary for a past period", () => {
  const habit = {
    id: "h",
    title: "Water",
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    completedDates: ["2026-10-01", "2026-10-31"],
  } as Parameters<typeof getHabitHistorySummary>[0][number]

  it("counts the whole past month, not just up to today's day number", () => {
    const summary = getHabitHistorySummary([habit], "month", new Date(2026, 9, 15), today)
    expect(summary.total).toBe(31)
    expect(summary.completed).toBe(2)
  })
  it("treats months of a later year as future in the year view", () => {
    const summary = getHabitHistorySummary([habit], "year", new Date(2026, 0, 1), new Date(2025, 5, 1))
    expect(summary.total).toBe(0)
  })
})
