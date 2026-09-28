import { describe, expect, it } from "vitest"
import { selectTodayHabits } from "./selectTodayHabits"
import type { Habit } from "../model/habit"

// activeDays defaults to every day of the week — the tests below only
// care about todayOrder sorting, not weekday filtering (already covered by
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
    todayOrder: 0,
    updatedAt: "2026-09-22T00:00:00.000Z",
    createdAt: "2026-09-22T00:00:00.000Z",
    ...overrides,
  }
}

describe("selectTodayHabits", () => {
  // Regression test for a real bug (2026-09-28): GET /api/habits always
  // sorts by `order`, not `todayOrder` — without this sort, a fresh fetch
  // (e.g. right after reloading the page post-drag) silently reverted
  // Today's habit order back to the `order`-based sequence even though
  // todayOrder was correctly saved server-side.
  it("sorts the result by todayOrder, not by the input array's own order", () => {
    const habits = [
      makeHabit({ id: "c", todayOrder: 2 }),
      makeHabit({ id: "a", todayOrder: 0 }),
      makeHabit({ id: "b", todayOrder: 1 }),
    ]
    expect(selectTodayHabits(habits).map(h => h.id)).toEqual(["a", "b", "c"])
  })

  it("still filters out habits not scheduled for today's weekday", () => {
    const habits = [
      makeHabit({ id: "a", todayOrder: 0, activeDays: [] }),
      makeHabit({ id: "b", todayOrder: 1 }),
    ]
    expect(selectTodayHabits(habits).map(h => h.id)).toEqual(["b"])
  })

  it("returns an empty array for an empty input", () => {
    expect(selectTodayHabits([])).toEqual([])
  })
})
