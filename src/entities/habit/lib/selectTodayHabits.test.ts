import { describe, expect, it } from "vitest"
import { selectTodayHabits } from "./selectTodayHabits"
import type { Habit } from "../model/habit"

// activeDays defaults to every day of the week — the tests below only
// care about the order Today keeps, not weekday filtering (already covered by
// selectHabitsOnDay.test.ts), so this keeps them independent of whatever
// day they happen to run on.
function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    title: "Test habit",
    completedDates: [],
    icon: "✨",
    color: "#000000",
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    groupId: "g1",
    updatedAt: "2026-09-22T00:00:00.000Z",
    createdAt: "2026-09-22T00:00:00.000Z",
    ...overrides,
  }
}

describe("selectTodayHabits", () => {
  // One habit order for Today and Habits since audit batch 4 (decision 4):
  // the input is already in that order, Today keeps it.
  it("keeps the shared habit order", () => {
    const habits = [makeHabit({ id: "c" }), makeHabit({ id: "a" }), makeHabit({ id: "b" })]
    expect(selectTodayHabits(habits).map(h => h.id)).toEqual(["c", "a", "b"])
  })

  it("still filters out habits not scheduled for today's weekday", () => {
    const habits = [makeHabit({ id: "a", activeDays: [] }), makeHabit({ id: "b" })]
    expect(selectTodayHabits(habits).map(h => h.id)).toEqual(["b"])
  })

  it("returns an empty array for an empty input", () => {
    expect(selectTodayHabits([])).toEqual([])
  })
})
