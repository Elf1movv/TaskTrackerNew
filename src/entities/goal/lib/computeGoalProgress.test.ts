import { describe, expect, it } from "vitest"
import { computeGoalProgress } from "./computeGoalProgress"

let n = 0
const step = (completed: boolean) => ({ id: String(++n), title: "s", completed })

describe("computeGoalProgress", () => {
  it("is 0 for an empty goal", () => {
    expect(computeGoalProgress([], [])).toBe(0)
  })
  it("keeps the old formula when there are no subgoals", () => {
    expect(computeGoalProgress([step(true), step(false), step(false)], [])).toBe(33)
  })
  it("counts each subgoal as one part, weighted by its own steps", () => {
    const subgoals = [
      { id: "a", title: "A", milestones: [step(true), step(false)] },
      { id: "b", title: "B", milestones: [] },
    ]
    // (1 + 0.5 + 0) / 3
    expect(computeGoalProgress([step(true)], subgoals)).toBe(50)
  })
  it("reaches exactly 100 only when everything is done", () => {
    expect(computeGoalProgress([step(true)], [{ id: "a", title: "A", milestones: [step(true)] }])).toBe(100)
  })
})
