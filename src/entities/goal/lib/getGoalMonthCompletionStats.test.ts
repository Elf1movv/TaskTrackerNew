import { describe, expect, it } from "vitest"
import { getGoalMonthCompletionStats } from "./getGoalMonthCompletionStats"
import type { Goal } from "../model/goal"

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "g1",
    title: "Test goal",
    description: "",
    progress: 0,
    targetDate: null,
    milestones: [],
    color: "#c97b3a",
    updatedAt: "2026-09-22T00:00:00.000Z",
    ...overrides,
  }
}

const SEPTEMBER = new Date(2026, 8, 1)

describe("getGoalMonthCompletionStats", () => {
  it("returns 0/0 for an empty list", () => {
    expect(getGoalMonthCompletionStats([], SEPTEMBER)).toEqual({ done: 0, total: 0 })
  })

  it("excludes undated (бессрочная) goals from both done and total", () => {
    const goals = [makeGoal({ targetDate: null, progress: 100 })]
    expect(getGoalMonthCompletionStats(goals, SEPTEMBER)).toEqual({ done: 0, total: 0 })
  })

  it("excludes goals due in a different month", () => {
    const goals = [makeGoal({ targetDate: "2026-08-15", progress: 100 })]
    expect(getGoalMonthCompletionStats(goals, SEPTEMBER)).toEqual({ done: 0, total: 0 })
  })

  it("only counts progress === 100 as done, not a partial like 80", () => {
    const goals = [
      makeGoal({ id: "a", targetDate: "2026-09-10", progress: 100 }),
      makeGoal({ id: "b", targetDate: "2026-09-15", progress: 80 }),
    ]
    expect(getGoalMonthCompletionStats(goals, SEPTEMBER)).toEqual({ done: 1, total: 2 })
  })

  it("counts month boundary dates (first and last day)", () => {
    const goals = [
      makeGoal({ id: "a", targetDate: "2026-09-01", progress: 100 }),
      makeGoal({ id: "b", targetDate: "2026-09-30", progress: 0 }),
    ]
    expect(getGoalMonthCompletionStats(goals, SEPTEMBER)).toEqual({ done: 1, total: 2 })
  })
})
