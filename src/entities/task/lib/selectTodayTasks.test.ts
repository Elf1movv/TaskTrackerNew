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

  it("excludes a completed task immediately, regardless of when it was completed", () => {
    expect(
      selectTodayTasks([makeTask({ completed: true, completedAt: "2026-09-23T08:00:00.000Z" })]),
    ).toHaveLength(0)
    expect(
      selectTodayTasks([makeTask({ completed: true, completedAt: "2026-09-01T08:00:00.000Z" })]),
    ).toHaveLength(0)
  })

  it("returns an empty array for an empty input", () => {
    expect(selectTodayTasks([])).toEqual([])
  })

  it("filters a mixed list down to only the incomplete tasks", () => {
    const tasks = [
      makeTask({ id: "a", completed: false }),
      makeTask({ id: "b", completed: true }),
      makeTask({ id: "c", completed: false, dueDate: "2020-01-01" }),
    ]
    expect(selectTodayTasks(tasks).map(t => t.id)).toEqual(["a", "c"])
  })
})
