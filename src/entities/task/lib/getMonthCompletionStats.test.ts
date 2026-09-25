import { describe, expect, it } from "vitest"
import { getTaskMonthCompletionStats } from "./getMonthCompletionStats"
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

const SEPTEMBER = new Date(2026, 8, 1)

describe("getTaskMonthCompletionStats", () => {
  it("returns 0/0 for an empty list", () => {
    expect(getTaskMonthCompletionStats([], SEPTEMBER)).toEqual({ done: 0, total: 0 })
  })

  it("excludes undated tasks from both done and total", () => {
    const tasks = [
      makeTask({ dueDate: null, completed: true }),
      makeTask({ dueDate: null, completed: false }),
    ]
    expect(getTaskMonthCompletionStats(tasks, SEPTEMBER)).toEqual({ done: 0, total: 0 })
  })

  it("excludes tasks due in a different month", () => {
    const tasks = [makeTask({ dueDate: "2026-08-15" }), makeTask({ dueDate: "2026-10-01" })]
    expect(getTaskMonthCompletionStats(tasks, SEPTEMBER)).toEqual({ done: 0, total: 0 })
  })

  it("counts month boundary dates (first and last day)", () => {
    const tasks = [
      makeTask({ dueDate: "2026-09-01", completed: true }),
      makeTask({ dueDate: "2026-09-30", completed: false }),
    ]
    expect(getTaskMonthCompletionStats(tasks, SEPTEMBER)).toEqual({ done: 1, total: 2 })
  })

  it("computes a partial done/total split", () => {
    const tasks = [
      makeTask({ id: "a", dueDate: "2026-09-05", completed: true }),
      makeTask({ id: "b", dueDate: "2026-09-10", completed: true }),
      makeTask({ id: "c", dueDate: "2026-09-15", completed: false }),
    ]
    expect(getTaskMonthCompletionStats(tasks, SEPTEMBER)).toEqual({ done: 2, total: 3 })
  })
})
