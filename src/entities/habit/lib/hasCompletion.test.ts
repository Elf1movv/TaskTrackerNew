import { describe, expect, it } from "vitest"
import { hasCompletion } from "./hasCompletion"

describe("hasCompletion", () => {
  it("answers like includes", () => {
    const habit = { completedDates: ["2026-11-01", "2026-11-03"] }
    expect(hasCompletion(habit, "2026-11-01")).toBe(true)
    expect(hasCompletion(habit, "2026-11-02")).toBe(false)
  })

  it("sees a new mark (a new list) at once", () => {
    const before = { completedDates: ["2026-11-01"] }
    expect(hasCompletion(before, "2026-11-02")).toBe(false)
    const after = { completedDates: [...before.completedDates, "2026-11-02"] }
    expect(hasCompletion(after, "2026-11-02")).toBe(true)
  })
})
