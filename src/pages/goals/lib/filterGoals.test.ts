import { describe, expect, it } from "vitest"
import { filterGoals, NO_CATEGORY_FILTER } from "./filterGoals"

const goals = [
  { id: "a", category: "Work" },
  { id: "b", category: null },
  { id: "c", category: "Health" },
]

describe("filterGoals", () => {
  it("keeps every goal for 'all'", () => {
    expect(filterGoals(goals, "all").map(g => g.id)).toEqual(["a", "b", "c"])
  })
  it("keeps only goals in the chosen category", () => {
    expect(filterGoals(goals, "Work").map(g => g.id)).toEqual(["a"])
  })
  it("keeps only goals without a category", () => {
    expect(filterGoals(goals, NO_CATEGORY_FILTER).map(g => g.id)).toEqual(["b"])
  })
})
