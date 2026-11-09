import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { LanguageProvider } from "@/shared/lib/i18n"
import { CategoryChips } from "./CategoryChips"

const state = vi.hoisted(() => ({
  deleteCategory: vi.fn(async () => {}),
  addCategory: vi.fn(),
  updateCategory: vi.fn(),
  reorderCategories: vi.fn(),
}))
vi.mock("@/entities/category", () => ({
  useCategories: () => ({
    categories: [
      { id: "w", name: "Work", color: "#3366cc", updatedAt: "" },
      { id: "h", name: "Home", color: "#33aa66", updatedAt: "" },
    ],
    ...state,
  }),
}))
vi.mock("@/entities/task", () => ({
  useTasks: () => ({
    tasks: [
      { id: "t1", category: "Work" },
      { id: "t2", category: "Work" },
    ],
  }),
}))

// Dragging itself is covered by useDragReorder's own tests and checked in the
// browser; here the chip only needs a ref.
vi.mock("@/shared/lib/dnd", () => ({ useDragReorder: () => ({ ref: () => {}, isDragging: false }) }))

const wrapper = ({ children }: { children: ReactNode }) => <LanguageProvider>{children}</LanguageProvider>

describe("CategoryChips (audit Д4 + Л4)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem("mytracker-language", "en")
  })
  afterEach(cleanup)

  it("filters by a category and shows page-specific extra chips", () => {
    const onChange = vi.fn()
    render(
      <CategoryChips
        value="all"
        onChange={onChange}
        extraChips={[{ value: "__none__", label: "No category" }]}
      />,
      {
        wrapper,
      },
    )
    fireEvent.click(screen.getByRole("button", { name: "Home" }))
    expect(onChange).toHaveBeenCalledWith("Home")
    fireEvent.click(screen.getByRole("button", { name: "No category" }))
    expect(onChange).toHaveBeenCalledWith("__none__")
  })

  it("deletes a category after confirming, warning about its tasks, and resets the filter", async () => {
    const onChange = vi.fn()
    render(<CategoryChips value="Work" onChange={onChange} />, { wrapper })
    fireEvent.click(screen.getByRole("button", { name: "Delete category Work" }))
    expect(screen.getByRole("alertdialog").textContent).toContain("2")
    expect(state.deleteCategory).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Delete" }))
    await waitFor(() => expect(state.deleteCategory).toHaveBeenCalledWith("w"))
    expect(onChange).toHaveBeenCalledWith("all")
  })

  it("adds a category", () => {
    render(<CategoryChips value="all" onChange={() => {}} />, { wrapper })
    fireEvent.click(screen.getByRole("button", { name: /Add category/ }))
    fireEvent.change(screen.getByPlaceholderText("New category"), { target: { value: "Study" } })
    fireEvent.click(screen.getByRole("button", { name: "Add" }))
    expect(state.addCategory).toHaveBeenCalledWith("Study", expect.any(String))
  })
})
