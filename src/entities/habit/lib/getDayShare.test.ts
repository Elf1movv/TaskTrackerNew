import { describe, expect, it } from "vitest"
import type { Habit } from "../model/habit"
import { getDayShare } from "./getDayShare"

function habit(over: Partial<Habit>): Habit {
  return {
    id: "h",
    title: "h",
    icon: "💧",
    color: "#38bdf8",
    completedDates: [],
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    groupId: "g",
    createdAt: "2026-01-01T08:00:00.000Z",
    updatedAt: "2026-01-01T08:00:00.000Z",
    ...over,
  }
}
const today = new Date(2026, 10, 16)

describe("getDayShare", () => {
  it("is the share of scheduled habits done that day", () => {
    const habits = [habit({ completedDates: ["2026-11-10"] }), habit({ id: "b" })]
    expect(getDayShare(habits, new Date(2026, 10, 10), today)).toBe(0.5)
  })

  it("ignores habits not scheduled that day or not created yet", () => {
    const habits = [
      habit({ completedDates: ["2026-11-10"] }),
      habit({ id: "b", activeDays: [0] }), // Sunday only; Nov 10 is a Tuesday
      habit({ id: "c", createdAt: "2026-11-12T08:00:00.000Z" }),
    ]
    expect(getDayShare(habits, new Date(2026, 10, 10), today)).toBe(1)
  })

  it("is null for future days and days with nothing scheduled", () => {
    expect(getDayShare([habit({})], new Date(2026, 10, 17), today)).toBeNull()
    expect(getDayShare([habit({ activeDays: [0] })], new Date(2026, 10, 10), today)).toBeNull()
  })
})
