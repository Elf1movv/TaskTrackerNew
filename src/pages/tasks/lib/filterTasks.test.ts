import { describe, expect, it } from "vitest"
import type { Task } from "@/entities/task"
import { filterTasks, sortActiveTasks } from "./filterTasks"

const task = (patch: Partial<Task>): Task =>
  ({
    id: "t",
    title: "T",
    completed: false,
    priority: "medium",
    category: "Work",
    dueDate: null,
    time: null,
    endTime: null,
    description: null,
    completedAt: null,
    createdAt: "2026-11-01T00:00:00Z",
    updatedAt: "2026-11-01T00:00:00Z",
    ...patch,
  }) as Task

describe("filterTasks", () => {
  it("filters by category only", () => {
    const tasks = [task({ id: "a" }), task({ id: "b", category: "Home", completed: true })]
    expect(filterTasks(tasks, "all").map(t => t.id)).toEqual(["a", "b"])
    expect(filterTasks(tasks, "Home").map(t => t.id)).toEqual(["b"])
  })
})

describe("sortActiveTasks", () => {
  it("puts dated tasks first by deadline and keeps manual order otherwise", () => {
    const tasks = [
      task({ id: "free1" }),
      task({ id: "late", dueDate: "2026-11-20" }),
      task({ id: "free2" }),
      task({ id: "soon", dueDate: "2026-11-10" }),
      task({ id: "soon2", dueDate: "2026-11-10" }),
    ]
    expect(sortActiveTasks(tasks).map(t => t.id)).toEqual(["soon", "soon2", "late", "free1", "free2"])
  })
})
