import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { LanguageProvider } from "@/shared/lib/i18n"
import { paginate, Pager } from "./pager"

beforeEach(() => localStorage.setItem("mytracker-language", "en"))
afterEach(cleanup)

describe("paginate", () => {
  it("slices a page and clamps a page that no longer exists", () => {
    const items = Array.from({ length: 12 }, (_, i) => i)
    expect(paginate(items, 2, 5)).toMatchObject({ page: 2, pageCount: 3, start: 5, items: [5, 6, 7, 8, 9] })
    expect(paginate(items, 9, 5)).toMatchObject({ page: 3, items: [10, 11] })
    expect(paginate([], 1, 5)).toMatchObject({ page: 1, pageCount: 1, items: [] })
  })
})

describe("Pager", () => {
  it("hides itself for a single page", () => {
    const { container } = render(<Pager page={1} pageCount={1} onPageChange={() => {}} label="x" />, {
      wrapper: LanguageProvider,
    })
    expect(container.innerHTML).toBe("")
  })
  it("moves between pages and disables the ends", () => {
    const onPageChange = vi.fn()
    render(<Pager page={1} pageCount={3} onPageChange={onPageChange} label="Notes pages" />, {
      wrapper: LanguageProvider,
    })
    expect((screen.getByRole("button", { name: "Previous" }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })
})
