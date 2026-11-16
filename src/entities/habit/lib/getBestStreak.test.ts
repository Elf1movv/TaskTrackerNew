import { describe, expect, it } from "vitest"
import { getBestStreak } from "./getBestStreak"

const ALL = [0, 1, 2, 3, 4, 5, 6]
const today = new Date(2026, 10, 16) // Monday

describe("getBestStreak", () => {
  it("is 0 with no marks", () => {
    expect(getBestStreak([], ALL, today)).toBe(0)
  })

  it("finds the longest run, not the latest one", () => {
    const dates = ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-05", "2026-11-06"]
    expect(getBestStreak(dates, ALL, today)).toBe(3)
  })

  it("skips days outside the schedule instead of breaking the run", () => {
    // Mon/Wed/Fri: Nov 2, 4, 6, 9 are all scheduled and done.
    const dates = ["2026-11-02", "2026-11-04", "2026-11-06", "2026-11-09"]
    expect(getBestStreak(dates, [1, 3, 5], today)).toBe(4)
  })

  it("does not break the run on today when today is not marked yet", () => {
    const dates = ["2026-11-14", "2026-11-15"]
    expect(getBestStreak(dates, ALL, today)).toBe(2)
  })
})
