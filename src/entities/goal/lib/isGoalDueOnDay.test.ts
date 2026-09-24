import { describe, expect, it } from "vitest"
import { isGoalDueOnDay } from "./isGoalDueOnDay"
import type { Goal } from "../model/goal"

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "g1",
    title: "Test goal",
    description: "",
    progress: 0,
    targetDate: null,
    milestones: [],
    color: "#000000",
    updatedAt: "2026-09-22T00:00:00.000Z",
    ...overrides,
  }
}

describe("isGoalDueOnDay", () => {
  it("matches a goal whose deadline is exactly this day", () => {
    expect(isGoalDueOnDay(makeGoal({ targetDate: "2026-09-24" }), "2026-09-24")).toBe(true)
  })

  it("doesn't match a goal due on a different day", () => {
    expect(isGoalDueOnDay(makeGoal({ targetDate: "2026-09-23" }), "2026-09-24")).toBe(false)
  })

  it("never matches an undated (no-deadline) goal", () => {
    expect(isGoalDueOnDay(makeGoal({ targetDate: null }), "2026-09-24")).toBe(false)
  })
})
