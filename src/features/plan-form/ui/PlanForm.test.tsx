import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter } from "react-router"
import { LanguageProvider } from "@/shared/lib/i18n"
import { PlanForm } from "./PlanForm"

const { addPlan, updatePlan, addTask } = vi.hoisted(() => ({
  addPlan: vi.fn(),
  updatePlan: vi.fn(),
  addTask: vi.fn(),
}))
vi.mock("@/entities/calendar-plan", () => ({
  usePlans: () => ({ addPlan, updatePlan, deletePlan: vi.fn() }),
}))
vi.mock("@/entities/task", () => ({ useTasks: () => ({ tasks: [], addTask }) }))
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <LanguageProvider>{children}</LanguageProvider>
  </MemoryRouter>
)

describe("Calendar creation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    addPlan.mockResolvedValue(true)
    localStorage.setItem("mytracker-language", "en")
  })
  afterEach(cleanup)

  it("uses the selected day and keeps the draft when another day is selected", async () => {
    const { rerender } = render(<PlanForm defaultDate="2026-10-05" onDone={() => {}} />, { wrapper })
    fireEvent.change(screen.getByRole("textbox", { name: "Add plan" }), { target: { value: "Visit" } })
    fireEvent.change(screen.getByPlaceholderText("Description — optional"), {
      target: { value: "Bring documents" },
    })
    rerender(<PlanForm defaultDate="2026-10-07" onDone={() => {}} />)
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() =>
      expect(addPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Visit",
          description: "Bring documents",
          date: "2026-10-07",
          time: null,
          taskId: null,
        }),
      ),
    )
    expect(addTask).not.toHaveBeenCalled()
  })

  it("keeps an unsaved draft open if creating a plan fails", async () => {
    addPlan.mockResolvedValue(false)
    const onDone = vi.fn()
    render(<PlanForm defaultDate="2026-10-05" onDone={onDone} />, { wrapper })
    fireEvent.change(screen.getByRole("textbox", { name: "Add plan" }), {
      target: { value: "Keep this draft" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() =>
      expect((screen.getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(false),
    )
    expect(onDone).not.toHaveBeenCalled()
    expect((screen.getByRole("textbox", { name: "Add plan" }) as HTMLInputElement).value).toBe(
      "Keep this draft",
    )
  })
})
