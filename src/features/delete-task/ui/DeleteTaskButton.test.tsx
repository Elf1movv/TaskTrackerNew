import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { LanguageProvider } from "@/shared/lib/i18n"
import { DeleteTaskButton } from "./DeleteTaskButton"

const { deleteTask } = vi.hoisted(() => ({ deleteTask: vi.fn() }))
vi.mock("@/entities/task", () => ({ useTasks: () => ({ deleteTask }) }))

describe("Deleting a task asks first (audit П10)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem("mytracker-language", "en")
  })
  afterEach(cleanup)

  function open() {
    render(<DeleteTaskButton taskId="t1" taskTitle="Report" />, { wrapper: LanguageProvider })
    fireEvent.click(screen.getByRole("button", { name: "Delete task" }))
  }

  it("does nothing until the user confirms", () => {
    open()
    expect(screen.getByRole("alertdialog")).toBeTruthy()
    expect(screen.getByText("The task “Report” will be deleted. This can't be undone.")).toBeTruthy()
    expect(deleteTask).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(deleteTask).not.toHaveBeenCalled()
  })

  it("deletes on a red Delete button", () => {
    open()
    const confirm = screen.getByRole("button", { name: "Delete" })
    expect(confirm.className).toContain("bg-destructive")
    fireEvent.click(confirm)
    expect(deleteTask).toHaveBeenCalledWith("t1")
  })
})
