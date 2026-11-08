import { describe, expect, it } from "vitest"
import { getGoalItems, nextGoalItemOrder, reorderGoalItems } from "./goalItems"

const step = (id: string, order?: number) => ({ id, title: id, completed: false, order })
const subgoal = (id: string, order?: number) => ({ id, title: id, milestones: [], order })
const ids = (goal: Parameters<typeof getGoalItems>[0]) => getGoalItems(goal).map(e => e.item.id)

describe("goal items order", () => {
  it("keeps the old layout for goals saved without an order: steps, then subgoals", () => {
    const goal = { milestones: [step("a"), step("b")], subgoals: [subgoal("S")] }
    expect(ids(goal)).toEqual(["a", "b", "S"])
  })

  it("interleaves steps and subgoals by their order", () => {
    const goal = { milestones: [step("a", 0), step("b", 2)], subgoals: [subgoal("S", 1)] }
    expect(ids(goal)).toEqual(["a", "S", "b"])
  })

  it("moves a step above a subgoal and writes an order to every item", () => {
    const goal = { milestones: [step("a"), step("b")], subgoals: [subgoal("S")] }
    const next = reorderGoalItems(goal, "S", "a")
    expect(ids(next)).toEqual(["S", "a", "b"])
    expect(next.milestones.map(m => m.order)).toEqual([1, 2])
    expect(next.subgoals.map(s => s.order)).toEqual([0])
  })

  it("puts a new item after everything else", () => {
    expect(nextGoalItemOrder({ milestones: [], subgoals: [] })).toBe(0)
    expect(nextGoalItemOrder({ milestones: [step("a")], subgoals: [subgoal("S")] })).toBe(2)
    expect(nextGoalItemOrder({ milestones: [step("a", 5)], subgoals: [subgoal("S", 1)] })).toBe(6)
  })
})
