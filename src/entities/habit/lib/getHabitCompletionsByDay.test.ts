import { describe, expect, it } from "vitest"
import { getHabitCompletionsByDay } from "./getHabitCompletionsByDay"
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

describe("getHabitCompletionsByDay", () => {
  // 2026-09-24/25/26 are Thu/Fri/Sat.
  const days = [new Date("2026-09-24"), new Date("2026-09-25"), new Date("2026-09-26")]

  it("counts a habit completed on a scheduled day", () => {
    const habit = makeHabit({ activeDays: [4], completedDates: ["2026-09-24"] }) // Thursday
    expect(getHabitCompletionsByDay([habit], days)).toEqual([1, 0, 0])
  })

  it("ignores a completedDates entry for a day the habit isn't scheduled on", () => {
    const habit = makeHabit({ activeDays: [1, 2, 3], completedDates: ["2026-09-24"] }) // Mon-Wed only
    expect(getHabitCompletionsByDay([habit], days)).toEqual([0, 0, 0])
  })

  it("sums multiple habits completed on the same day", () => {
    const a = makeHabit({ id: "a", completedDates: ["2026-09-26"] })
    const b = makeHabit({ id: "b", completedDates: ["2026-09-26"] })
    expect(getHabitCompletionsByDay([a, b], days)).toEqual([0, 0, 2])
  })
})
