import { describe, expect, it } from "vitest"
import { isTaskOnDay } from "./isTaskOnDay"
import type { Task } from "../model/task"

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Test task",
    completed: false,
    priority: "medium",
    category: "Work",
    dueDate: null,
    time: null,
    endTime: null,
    completedAt: null,
    updatedAt: "2026-09-22T00:00:00.000Z",
    createdAt: "2026-09-22T00:00:00.000Z",
    ...overrides,
  }
}

describe("isTaskOnDay", () => {
  it("matches when dueDate equals the given day", () => {
    expect(isTaskOnDay(makeTask({ dueDate: "2026-09-24" }), "2026-09-24")).toBe(true)
  })

  it("does not match a different dueDate", () => {
    expect(isTaskOnDay(makeTask({ dueDate: "2026-09-23" }), "2026-09-24")).toBe(false)
  })

  it("does not match an undated task, even if completed that day", () => {
    // Deliberately no completedAt fallback on the calendar (unlike
    // selectTodayTasks) — see this file's own comment for why.
    const task = makeTask({ dueDate: null, completed: true, completedAt: "2026-09-24T10:00:00.000Z" })
    expect(isTaskOnDay(task, "2026-09-24")).toBe(false)
  })

  it("does not match an undated, uncompleted task on any day", () => {
    expect(isTaskOnDay(makeTask({ dueDate: null }), "2026-09-24")).toBe(false)
  })
})
