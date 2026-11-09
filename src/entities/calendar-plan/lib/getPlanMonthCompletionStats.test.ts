import { describe, expect, it } from "vitest"
import type { CalendarPlan } from "../model/plan"
import { getPlanMonthCompletionStats } from "./getPlanMonthCompletionStats"

const plan = (fields: Partial<CalendarPlan>) =>
  ({ onHold: false, completed: false, date: null, ...fields }) as CalendarPlan

describe("getPlanMonthCompletionStats", () => {
  it("counts plans dated in the month, skipping held and other-month ones", () => {
    const plans = [
      plan({ date: "2026-11-02", completed: true }),
      plan({ date: "2026-11-20" }),
      plan({ date: "2026-12-01", completed: true }),
      plan({ date: null, onHold: true }),
    ]
    expect(getPlanMonthCompletionStats(plans, new Date(2026, 10, 1))).toEqual({ done: 1, total: 2 })
  })
})
