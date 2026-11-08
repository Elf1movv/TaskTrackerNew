import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { DndProvider } from "react-dnd"
import { TestBackend } from "react-dnd-test-backend"
import { LanguageProvider } from "@/shared/lib/i18n"
import type { Note } from "@/entities/note"
import { NotesCard } from "./NotesCard"
const state = vi.hoisted(() => ({
  notes: [] as Note[],
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  reorderNotes: vi.fn(),
  refreshNotes: vi.fn(async () => {}),
  refreshTasks: vi.fn(async () => {}),
  addTask: vi.fn(),
  moveNoteToTask: vi.fn(async () => true),
}))
vi.mock("@/entities/note", () => ({
  useNotes: () => ({ ...state, isLoaded: true }),
  moveNoteToTask: state.moveNoteToTask,
}))
vi.mock("@/entities/task", async importOriginal => ({
  ...(await importOriginal<typeof import("@/entities/task")>()),
  useTasks: () => ({ addTask: state.addTask, updateTask: vi.fn(), refreshTasks: state.refreshTasks }),
}))
vi.mock("@/entities/category", () => ({
  useCategories: () => ({ categories: [{ id: "work", name: "Work", color: "#123456" }] }),
}))
const note = (patch: Partial<Note> = {}): Note => ({
  id: "first",
  title: "Remember milk",
  description: "Short description",
  archivedAt: null,
  completed: false,
  createdAt: "2026-10-10T00:00:00Z",
  updatedAt: "2026-10-10T00:00:00Z",
  ...patch,
})
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <DndProvider backend={TestBackend}>
    <LanguageProvider>{children}</LanguageProvider>
  </DndProvider>
)
beforeEach(() => {
  vi.clearAllMocks()
  state.moveNoteToTask.mockResolvedValue(true)
  localStorage.setItem("mytracker-language", "en")
  state.notes = [note()]
})
afterEach(cleanup)
describe("Note actions", () => {
  it("offers only Current and Archive — notes are undated", () => {
    render(<NotesCard />, { wrapper })
    const tabs = screen.getAllByRole("button").filter(b => b.hasAttribute("aria-pressed"))
    expect(tabs.map(b => b.textContent)).toEqual(["Current", "Archive"])
  })
  it("actually hides and reveals even a one-line description", () => {
    render(<NotesCard />, { wrapper })
    expect(screen.queryByText("Short description")).toBeNull()
    const title = screen.getByRole("button", { name: "Remember milk" })
    fireEvent.click(title)
    expect(screen.getByText("Short description")).toBeTruthy()
    expect(title.getAttribute("aria-expanded")).toBe("true")
    fireEvent.click(title)
    expect(screen.queryByText("Short description")).toBeNull()
  })
  it("completes and reopens without archiving or hiding the note", () => {
    const { rerender } = render(<NotesCard />, { wrapper })
    fireEvent.click(screen.getByRole("checkbox", { name: "Complete note" }))
    expect(state.updateNote).toHaveBeenLastCalledWith("first", { completed: true })
    state.notes = [note({ completed: true })]
    rerender(<NotesCard />)
    expect(screen.getByText("Remember milk").className).toContain("line-through")
    fireEvent.click(screen.getByRole("checkbox", { name: "Reopen note" }))
    expect(state.updateNote).toHaveBeenLastCalledWith("first", { completed: false })
  })
  it.each(["Current", "Archive"])("confirms deletion and supports cancel in %s", tab => {
    state.notes = [note({ archivedAt: tab === "Archive" ? "2026-10-10T00:00:00Z" : null })]
    render(<NotesCard />, { wrapper })
    fireEvent.click(screen.getByRole("button", { name: tab }))
    fireEvent.click(screen.getByRole("button", { name: "Delete note" }))
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancel" }))
    expect(state.deleteNote).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Delete note" }))
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }))
    expect(state.deleteNote).toHaveBeenCalledWith("first")
  })
  it("respects manual order and moves within the visible tab using the handle", () => {
    state.notes = [
      note(),
      note({ id: "hidden", title: "Archived hidden", archivedAt: "2026-10-10T00:00:00Z" }),
      note({ id: "second", title: "Second" }),
    ]
    render(<NotesCard />, { wrapper })
    const rows = screen.getAllByRole("article")
    expect(rows.map(row => row.dataset.noteId)).toEqual(["first", "second"])
    fireEvent.keyDown(within(rows[1]).getByRole("button", { name: "Move note (up/down arrows)" }), {
      key: "ArrowUp",
    })
    expect(state.reorderNotes).toHaveBeenCalledWith("second", "first")
  })
})
describe("Paging", () => {
  it("shows 10 notes per page and keeps arrow-key neighbours across the page edge", () => {
    state.notes = Array.from({ length: 12 }, (_, i) => note({ id: "n" + i, title: "Note " + i }))
    render(<NotesCard />, { wrapper })
    expect(screen.getAllByRole("article")).toHaveLength(10)
    const last = screen.getAllByRole("article")[9]
    fireEvent.keyDown(within(last).getByRole("button", { name: "Move note (up/down arrows)" }), {
      key: "ArrowDown",
    })
    expect(state.reorderNotes).toHaveBeenCalledWith("n9", "n10")
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    expect(screen.getAllByRole("article").map(a => a.dataset.noteId)).toEqual(["n10", "n11"])
  })
})
describe("Move to tasks", () => {
  it("opens a task form prefilled from the note and moves it on save", async () => {
    render(<NotesCard />, { wrapper })
    fireEvent.click(screen.getByRole("button", { name: "Move to tasks" }))
    expect((screen.getByPlaceholderText("What needs to be done?") as HTMLInputElement).value).toBe(
      "Remember milk",
    )
    fireEvent.click(screen.getByRole("button", { name: "Add task" }))
    await waitFor(() => expect(state.refreshTasks).toHaveBeenCalled())
    expect(state.moveNoteToTask).toHaveBeenCalledWith(
      expect.objectContaining({ id: "first", updatedAt: "2026-10-10T00:00:00Z" }),
      expect.objectContaining({
        title: "Remember milk",
        description: "Short description",
        category: "Work",
        completed: false,
      }),
    )
    expect(state.refreshNotes).toHaveBeenCalled()
    // The regular "add task" path is never used for a move — no duplicate.
    expect(state.addTask).not.toHaveBeenCalled()
  })
  it("keeps the note and the form open when the move fails", async () => {
    state.moveNoteToTask.mockResolvedValue(false)
    render(<NotesCard />, { wrapper })
    fireEvent.click(screen.getByRole("button", { name: "Move to tasks" }))
    fireEvent.click(screen.getByRole("button", { name: "Add task" }))
    await waitFor(() => expect(state.refreshNotes).toHaveBeenCalled())
    expect(state.refreshTasks).not.toHaveBeenCalled()
    expect(screen.getByPlaceholderText("What needs to be done?")).toBeTruthy()
  })
  it("cancel leaves the note untouched", () => {
    render(<NotesCard />, { wrapper })
    fireEvent.click(screen.getByRole("button", { name: "Move to tasks" }))
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(state.moveNoteToTask).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Remember milk" })).toBeTruthy()
  })
})
