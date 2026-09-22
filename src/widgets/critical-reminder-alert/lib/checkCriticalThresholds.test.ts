import { describe, expect, it } from "vitest"
import { checkCriticalThresholds } from "./checkCriticalThresholds"
import type { Reminder } from "@/entities/reminder"

function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: "r1",
    title: "Сходить ко врачу",
    date: "2026-09-25",
    time: "14:00",
    priority: "critical",
    completed: false,
    updatedAt: "2026-09-22T00:00:00.000Z",
    ...overrides,
  }
}

describe("checkCriticalThresholds", () => {
  it("fires the 24h threshold once now enters the 24h-before window", () => {
    const target = new Date("2026-09-25T14:00:00")
    const now = new Date(target.getTime() - 23.5 * 60 * 60 * 1000) // 23.5h before
    const alerts = checkCriticalThresholds([makeReminder()], {}, now)
    expect(alerts).toEqual([{ reminder: makeReminder(), threshold: "24h" }])
  })

  it("does not re-fire a threshold already recorded as shown", () => {
    const target = new Date("2026-09-25T14:00:00")
    const now = new Date(target.getTime() - 23.5 * 60 * 60 * 1000)
    const alerts = checkCriticalThresholds([makeReminder()], { r1: ["24h"] }, now)
    expect(alerts).toEqual([])
  })

  it("fires the 1h threshold separately from 24h", () => {
    const target = new Date("2026-09-25T14:00:00")
    const now = new Date(target.getTime() - 30 * 60 * 1000) // 30 minutes before
    const alerts = checkCriticalThresholds([makeReminder()], { r1: ["24h"] }, now)
    expect(alerts).toEqual([{ reminder: makeReminder(), threshold: "1h" }])
  })

  it("fires both thresholds at once on a catch-up check (app was closed until 30 min before)", () => {
    const target = new Date("2026-09-25T14:00:00")
    const now = new Date(target.getTime() - 30 * 60 * 1000)
    const alerts = checkCriticalThresholds([makeReminder()], {}, now)
    expect(alerts.map(a => a.threshold).sort()).toEqual(["1h", "24h"])
  })

  it("does not fire once the target time has already passed", () => {
    const target = new Date("2026-09-25T14:00:00")
    const now = new Date(target.getTime() + 60 * 1000)
    const alerts = checkCriticalThresholds([makeReminder()], {}, now)
    expect(alerts).toEqual([])
  })

  it("falls back to a once-a-day alert for a reminder with no time set", () => {
    const now = new Date("2026-09-25T09:00:00")
    const reminder = makeReminder({ time: null })
    const alerts = checkCriticalThresholds([reminder], {}, now)
    expect(alerts).toEqual([{ reminder, threshold: "day" }])
  })

  it("does not fire the day-level alert on a day other than the reminder's date", () => {
    const now = new Date("2026-09-24T09:00:00")
    const reminder = makeReminder({ time: null })
    const alerts = checkCriticalThresholds([reminder], {}, now)
    expect(alerts).toEqual([])
  })

  it("does not re-fire the day-level alert already recorded as shown", () => {
    const now = new Date("2026-09-25T09:00:00")
    const reminder = makeReminder({ time: null })
    const alerts = checkCriticalThresholds([reminder], { r1: ["day"] }, now)
    expect(alerts).toEqual([])
  })
})
