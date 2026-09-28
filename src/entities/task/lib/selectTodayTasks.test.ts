import { describe, expect, it } from "vitest"
import { selectTodayTasks } from "./selectTodayTasks"
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

describe("selectTodayTasks", () => {
  it("includes an incomplete task regardless of its due date", () => {
    expect(selectTodayTasks([makeTask({ dueDate: "2026-09-23" })])).toHaveLength(1)
    expect(selectTodayTasks([makeTask({ dueDate: "2026-09-01" })])).toHaveLength(1)
    expect(selectTodayTasks([makeTask({ dueDate: null })])).toHaveLength(1)
  })

  it("keeps a task completed earlier today", () => {
    const now = new Date()
    const completedTodayIso = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8).toISOString()
    expect(selectTodayTasks([makeTask({ completed: true, completedAt: completedTodayIso })])).toHaveLength(1)
  })

  it("excludes a task completed on a previous day", () => {
    expect(
      selectTodayTasks([makeTask({ completed: true, completedAt: "2026-09-01T08:00:00.000Z" })]),
    ).toHaveLength(0)
  })

  it("returns an empty array for an empty input", () => {
    expect(selectTodayTasks([])).toEqual([])
  })

  it("filters a mixed list down to incomplete tasks plus ones completed today", () => {
    const now = new Date()
    const completedTodayIso = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8).toISOString()
    const tasks = [
      makeTask({ id: "a", completed: false }),
      makeTask({ id: "b", completed: true, completedAt: "2020-01-01T08:00:00.000Z" }),
      makeTask({ id: "c", completed: false, dueDate: "2020-01-01" }),
      makeTask({ id: "d", completed: true, completedAt: completedTodayIso }),
    ]
    expect(selectTodayTasks(tasks).map(t => t.id)).toEqual(["a", "c", "d"])
  })
})
