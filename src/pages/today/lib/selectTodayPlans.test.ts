import { describe, expect, it } from "vitest"
import { selectTodayPlans } from "./selectTodayPlans"

const plan = (id: string, date: string | null, time: string | null, onHold = false) => ({
  id,
  date,
  time,
  onHold,
})

describe("selectTodayPlans", () => {
  it("keeps only today's scheduled plans, timed by start time and untimed last", () => {
    const plans = [
      plan("untimed", "2026-11-08", null),
      plan("late", "2026-11-08", "18:00"),
      plan("tomorrow", "2026-11-09", "08:00"),
      plan("held", null, null, true),
      plan("early", "2026-11-08", "07:30"),
    ]
    expect(selectTodayPlans(plans, "2026-11-08").map(p => p.id)).toEqual(["early", "late", "untimed"])
  })
  it("returns an empty list when nothing is planned today", () => {
    expect(selectTodayPlans([plan("other", "2026-11-09", "10:00")], "2026-11-08")).toEqual([])
  })
})
