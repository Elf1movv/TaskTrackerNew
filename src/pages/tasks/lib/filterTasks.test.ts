import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Task } from "@/entities/task"
import { filterTasks } from "./filterTasks"

function task(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: id,
    completed: false,
    priority: "medium",
    category: "Work",
    dueDate: null,
    time: null,
    endTime: null,
    description: null,
    completedAt: null,
    updatedAt: "2026-10-02T08:00:00.000Z",
    createdAt: "2026-10-02T08:00:00.000Z",
    ...overrides,
  }
}

describe("Tasks list visibility", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 2, 12))
  })
  afterEach(() => vi.useRealTimers())

  it("keeps the same record in the list when a date is assigned, moved or cleared", () => {
    const original = task("same-id")
    for (const dueDate of [null, "2026-09-01", "2026-10-02", "2026-11-01", null]) {
      const edited = { ...original, dueDate }
      expect(filterTasks([edited], "all", "all")).toEqual([edited])
    }
  })

  it("combines date, category and status filters", () => {
    const tasks = [
      task("undated"),
      task("scheduled", { dueDate: "2026-10-10" }),
      task("other-category", { category: "Personal", dueDate: "2026-10-10" }),
      task("done-today", {
        completed: true,
        dueDate: "2026-10-10",
        completedAt: new Date(2026, 9, 2, 8).toISOString(),
      }),
      task("done-before", {
        completed: true,
        dueDate: "2026-10-10",
        completedAt: "2026-09-01T08:00:00.000Z",
      }),
    ]
    expect(filterTasks(tasks, "active", "Work", "dated").map(t => t.id)).toEqual(["scheduled"])
    expect(filterTasks(tasks, "all", "all", "undated").map(t => t.id)).toEqual(["undated"])
    expect(filterTasks(tasks, "done", "Work", "dated").map(t => t.id)).toEqual(["done-today", "done-before"])
    expect(filterTasks(tasks, "all", "all").map(t => t.id)).toEqual([
      "undated",
      "scheduled",
      "other-category",
      "done-today",
      "done-before",
    ])
  })
})
