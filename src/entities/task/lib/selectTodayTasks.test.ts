import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
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
    completedAt: null,
    updatedAt: "2026-09-22T00:00:00.000Z",
    createdAt: "2026-09-22T00:00:00.000Z",
    ...overrides,
  }
}

describe("selectTodayTasks", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-09-23T09:00:00"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows a dated task only on its exact due date", () => {
    expect(selectTodayTasks([makeTask({ dueDate: "2026-09-23" })])).toHaveLength(1)
    expect(selectTodayTasks([makeTask({ dueDate: "2026-09-22" })])).toHaveLength(0)
    expect(selectTodayTasks([makeTask({ dueDate: "2026-09-24" })])).toHaveLength(0)
  })

  it("carries over an undated, unfinished task from a previous day", () => {
    const task = makeTask({ dueDate: null, completed: false, createdAt: "2026-09-20T00:00:00.000Z" })
    expect(selectTodayTasks([task])).toHaveLength(1)
  })

  it("keeps an undated task on Today the day it was completed", () => {
    const task = makeTask({
      dueDate: null,
      completed: true,
      createdAt: "2026-09-20T00:00:00.000Z",
      completedAt: "2026-09-23T08:00:00.000Z",
    })
    expect(selectTodayTasks([task])).toHaveLength(1)
  })

  it("drops an undated task off Today the day after it was completed", () => {
    const task = makeTask({
      dueDate: null,
      completed: true,
      createdAt: "2026-09-20T00:00:00.000Z",
      completedAt: "2026-09-22T08:00:00.000Z",
    })
    expect(selectTodayTasks([task])).toHaveLength(0)
  })
})
