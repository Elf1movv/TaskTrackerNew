import { describe, expect, it } from "vitest"
import { getTodayKey } from "@/shared/lib/date"
import type { Reminder } from "../model/reminder"
import { selectVisibleReminders } from "./selectVisibleReminders"

const now = new Date()
const dayOffset = (n: number) => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + n, 12)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
const reminder = (fields: Partial<Reminder>): Reminder => ({
  id: "r",
  title: "R",
  date: getTodayKey(),
  time: null,
  priority: "normal",
  completed: false,
  updatedAt: now.toISOString(),
  ...fields,
})

describe("selectVisibleReminders", () => {
  it("keeps open reminders from today on and drops past ones", () => {
    const list = [
      reminder({ id: "past", date: dayOffset(-1) }),
      reminder({ id: "today" }),
      reminder({ id: "later", date: dayOffset(3) }),
    ]
    expect(selectVisibleReminders(list).map(r => r.id)).toEqual(["today", "later"])
  })

  it("keeps a reminder checked today, even one dated later", () => {
    const list = [reminder({ id: "later-done", date: dayOffset(3), completed: true })]
    expect(selectVisibleReminders(list).map(r => r.id)).toEqual(["later-done"])
  })

  it("hides a reminder checked on an earlier day", () => {
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12).toISOString()
    const list = [reminder({ id: "old-done", date: dayOffset(3), completed: true, updatedAt: yesterday })]
    expect(selectVisibleReminders(list)).toEqual([])
  })
})
