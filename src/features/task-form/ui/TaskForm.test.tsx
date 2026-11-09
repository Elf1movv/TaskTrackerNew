import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { LanguageProvider } from "@/shared/lib/i18n"
import type { Task } from "@/entities/task"
import { TaskForm } from "./TaskForm"

const { addTask, updateTask } = vi.hoisted(() => ({ addTask: vi.fn(), updateTask: vi.fn() }))
vi.mock("@/entities/task", async importOriginal => ({
  ...(await importOriginal<typeof import("@/entities/task")>()),
  useTasks: () => ({ addTask, updateTask }),
}))
vi.mock("@/entities/category", () => ({
  useCategories: () => ({ categories: [{ id: "work", name: "Work", color: "#123456" }] }),
}))

vi.mock("@/entities/goal", () => ({ useGoals: () => ({ goals: [] }) }))

describe("Task deadline", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem("mytracker-language", "en")
  })
  afterEach(cleanup)

  const existing: Task = {
    id: "same-id",
    title: "Inbox",
    category: "Work",
    priority: "medium",
    completed: false,
    dueDate: null,
    time: null,
    endTime: null,
    description: null,
    completedAt: null,
    createdAt: "2026-10-02T08:00:00.000Z",
    updatedAt: "2026-10-02T08:00:00.000Z",
  }

  it("creates an ordinary list task without a date", () => {
    render(<TaskForm onDone={() => {}} />, { wrapper: LanguageProvider })
    fireEvent.change(screen.getByPlaceholderText("What needs to be done?"), { target: { value: "Inbox" } })
    fireEvent.click(screen.getByRole("button", { name: "Add task" }))
    expect(addTask).toHaveBeenCalledWith(expect.objectContaining({ dueDate: null }))
  })

  it("can remove a task's deadline without creating a schedule", () => {
    render(<TaskForm task={{ ...existing, dueDate: "2026-10-05" }} onDone={() => {}} />, {
      wrapper: LanguageProvider,
    })
    fireEvent.click(screen.getByRole("button", { name: "Clear" }))
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(updateTask).toHaveBeenCalledWith(
      "same-id",
      expect.objectContaining({ dueDate: null, time: null, endTime: null }),
    )
  })

  it("edits the existing undated record and keeps it undated", () => {
    render(<TaskForm task={existing} onDone={() => {}} />, { wrapper: LanguageProvider })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(updateTask).toHaveBeenCalledWith("same-id", expect.objectContaining({ dueDate: null }))
    expect(addTask).not.toHaveBeenCalled()
  })
})
