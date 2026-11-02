import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
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
}))
vi.mock("@/entities/note", () => ({ useNotes: () => ({ ...state, isLoaded: true }) }))
const note = (patch: Partial<Note> = {}): Note => ({
  id: "first",
  title: "Remember milk",
  description: "Short description",
  showFrom: null,
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
  localStorage.setItem("mytracker-language", "en")
  state.notes = [note()]
})
afterEach(cleanup)
describe("Note actions", () => {
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
  it.each(["Current", "Upcoming", "Archive"])("confirms deletion and supports cancel in %s", tab => {
    state.notes = [
      note({
        showFrom: tab === "Upcoming" ? "2099-01-01" : null,
        archivedAt: tab === "Archive" ? "2026-10-10T00:00:00Z" : null,
      }),
    ]
    render(<NotesCard />, { wrapper })
    fireEvent.click(screen.getByRole("button", { name: tab }))
    fireEvent.click(screen.getByRole("button", { name: "Delete note" }))
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancel" }))
    expect(state.deleteNote).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Delete note" }))
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }))
    expect(state.deleteNote).toHaveBeenCalledWith("first")
  })
  it("respects manual order in upcoming and moves within the visible tab using the handle", () => {
    state.notes = [
      note({ showFrom: "2099-02-01" }),
      note({ id: "hidden", title: "Current hidden" }),
      note({ id: "second", title: "Earlier date", showFrom: "2099-01-01" }),
    ]
    render(<NotesCard />, { wrapper })
    fireEvent.click(screen.getByRole("button", { name: "Upcoming" }))
    const rows = screen.getAllByRole("article")
    expect(rows.map(row => row.dataset.noteId)).toEqual(["first", "second"])
    fireEvent.keyDown(within(rows[1]).getByRole("button", { name: "Move note (up/down arrows)" }), {
      key: "ArrowUp",
    })
    expect(state.reorderNotes).toHaveBeenCalledWith("second", "first")
  })
})
