import { describe, expect, it } from "vitest"
import { formatDateKey, getLastNDays } from "./date"

describe("getLastNDays", () => {
  it("returns n days ending on the reference date, oldest first", () => {
    const days = getLastNDays(7, new Date("2026-09-26"))
    expect(days).toHaveLength(7)
    expect(days.map(formatDateKey)).toEqual([
      "2026-09-20",
      "2026-09-21",
      "2026-09-22",
      "2026-09-23",
      "2026-09-24",
      "2026-09-25",
      "2026-09-26",
    ])
  })

  it("includes the reference date itself as the last entry", () => {
    const days = getLastNDays(3, new Date("2026-01-01"))
    expect(formatDateKey(days[days.length - 1])).toBe("2026-01-01")
  })
})
