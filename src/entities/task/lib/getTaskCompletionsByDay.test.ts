import { describe, expect, it } from "vitest"
import { getTaskCompletionsByDay } from "./getTaskCompletionsByDay"
import type { Task } from "../model/task"

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Test task",
    completed: false,
    priority: "low",
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

describe("getTaskCompletionsByDay", () => {
  const days = [new Date("2026-09-24"), new Date("2026-09-25"), new Date("2026-09-26")]

  it("counts a task on the day it was completed, not its due date", () => {
    const task = makeTask({ dueDate: "2026-09-24", completedAt: "2026-09-25T10:00:00.000Z" })
    expect(getTaskCompletionsByDay([task], days)).toEqual([0, 1, 0])
  })

  it("ignores tasks with no completedAt", () => {
    const task = makeTask({ completedAt: null })
    expect(getTaskCompletionsByDay([task], days)).toEqual([0, 0, 0])
  })

  it("ignores completions outside the given day range", () => {
    const task = makeTask({ completedAt: "2026-09-01T10:00:00.000Z" })
    expect(getTaskCompletionsByDay([task], days)).toEqual([0, 0, 0])
  })

  it("sums multiple tasks completed on the same day", () => {
    const a = makeTask({ id: "a", completedAt: "2026-09-26T08:00:00.000Z" })
    const b = makeTask({ id: "b", completedAt: "2026-09-26T20:00:00.000Z" })
    expect(getTaskCompletionsByDay([a, b], days)).toEqual([0, 0, 2])
  })
})
