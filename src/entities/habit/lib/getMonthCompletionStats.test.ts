import { describe, expect, it } from "vitest"
import { getHabitMonthCompletionStats } from "./getMonthCompletionStats"
import type { Habit } from "../model/habit"

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    title: "Test habit",
    icon: "sparkles",
    color: "#c97b3a",
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    completedDates: [],
    todayOrder: 0,
    groupId: "general",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  }
}

const SEPTEMBER = new Date(2026, 8, 1)
const TODAY_MID_SEPTEMBER = new Date(2026, 8, 15)

describe("getHabitMonthCompletionStats", () => {
  it("returns 0/0 for a future month", () => {
    const habit = makeHabit()
    expect(getHabitMonthCompletionStats(habit, new Date(2026, 9, 1), TODAY_MID_SEPTEMBER)).toEqual({
      done: 0,
      scheduled: 0,
    })
  })

  it("returns 0/0 for a month before the habit was created", () => {
    const habit = makeHabit({ createdAt: "2026-09-10T00:00:00.000Z" })
    expect(getHabitMonthCompletionStats(habit, new Date(2026, 7, 1), TODAY_MID_SEPTEMBER)).toEqual({
      done: 0,
      scheduled: 0,
    })
  })

  it("only counts up through today for the current month, not the whole month", () => {
    const habit = makeHabit({ createdAt: "2026-09-01T00:00:00.000Z" })
    const { scheduled } = getHabitMonthCompletionStats(habit, SEPTEMBER, TODAY_MID_SEPTEMBER)
    expect(scheduled).toBe(15)
  })

  it("only counts from the habit's creation day onward within its creation month", () => {
    const habit = makeHabit({ createdAt: "2026-09-10T00:00:00.000Z" })
    const { scheduled } = getHabitMonthCompletionStats(habit, SEPTEMBER, TODAY_MID_SEPTEMBER)
    expect(scheduled).toBe(6) // days 10-15 inclusive
  })

  it("counts completed dates against scheduled active days", () => {
    const habit = makeHabit({
      createdAt: "2026-09-01T00:00:00.000Z",
      completedDates: ["2026-09-01", "2026-09-02", "2026-09-15"],
    })
    expect(getHabitMonthCompletionStats(habit, SEPTEMBER, TODAY_MID_SEPTEMBER)).toEqual({
      done: 3,
      scheduled: 15,
    })
  })

  it("excludes days not in activeDays from scheduled", () => {
    // Only Mondays (1) active — September 2026: 1st is Tue, so Mondays in
    // range Sep 1-15 are the 7th and 14th.
    const habit = makeHabit({ createdAt: "2026-09-01T00:00:00.000Z", activeDays: [1] })
    const { scheduled } = getHabitMonthCompletionStats(habit, SEPTEMBER, TODAY_MID_SEPTEMBER)
    expect(scheduled).toBe(2)
  })
})
