import { describe, expect, it } from "vitest"
import { selectHabitsOnDay } from "./selectHabitsOnDay"
import type { Habit } from "../model/habit"

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    title: "Test habit",
    completedDates: [],
    icon: "✨",
    color: "#000000",
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    groupId: "g1",
    todayOrder: 0,
    updatedAt: "2026-09-22T00:00:00.000Z",
    createdAt: "2026-09-22T00:00:00.000Z",
    ...overrides,
  }
}

describe("selectHabitsOnDay", () => {
  it("includes a habit scheduled on that day's weekday", () => {
    // 2026-09-24 is a Thursday (getDay() === 4).
    const habit = makeHabit({ activeDays: [4] })
    expect(selectHabitsOnDay([habit], new Date("2026-09-24"))).toEqual([habit])
  })

  it("excludes a habit not scheduled on that day's weekday", () => {
    const habit = makeHabit({ activeDays: [1, 2, 3] }) // Mon-Wed only
    expect(selectHabitsOnDay([habit], new Date("2026-09-24"))).toEqual([]) // Thursday
  })

  it("gives the same result for the same weekday regardless of which specific date it is", () => {
    const habit = makeHabit({ activeDays: [4] })
    // Both are Thursdays, a week apart.
    expect(selectHabitsOnDay([habit], new Date("2026-09-17"))).toEqual([habit])
    expect(selectHabitsOnDay([habit], new Date("2026-09-24"))).toEqual([habit])
  })
})
