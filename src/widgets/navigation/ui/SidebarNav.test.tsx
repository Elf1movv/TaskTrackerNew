import { cleanup, render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getTodayKey } from "@/shared/lib/date"
import { LanguageProvider } from "@/shared/lib/i18n"
import { SidebarNav } from "./SidebarNav"

const state = vi.hoisted(() => ({
  tasks: [] as unknown[],
  habits: [] as unknown[],
  goals: [] as unknown[],
}))
vi.mock("@/entities/task", async importOriginal => ({
  ...(await importOriginal<typeof import("@/entities/task")>()),
  useTasks: () => ({ tasks: state.tasks }),
}))
vi.mock("@/entities/habit", async importOriginal => ({
  ...(await importOriginal<typeof import("@/entities/habit")>()),
  useHabits: () => ({ habits: state.habits }),
}))
vi.mock("@/entities/goal", () => ({ useGoals: () => ({ goals: state.goals }) }))
vi.mock("@/shared/ui/weekly-activity-chart", () => ({ WeeklyActivityChart: () => null }))

const todayWeekday = new Date().getDay()
const otherWeekday = (todayWeekday + 1) % 7
const task = (fields: object) => ({ completed: false, completedAt: null, dueDate: null, ...fields })
const habit = (fields: object) => ({
  completedDates: [],
  activeDays: [todayWeekday],
  ...fields,
})

// The value next to a stat label in the "Today" block (a nav link may share
// the label, e.g. "Habits", so pick the one inside a stat row).
function stat(label: string) {
  const labelEl = screen
    .getAllByText(label)
    .find(el => el.parentElement?.className.includes("justify-between")) as HTMLElement
  const cells = within(labelEl.parentElement as HTMLElement).getAllByText(/./)
  return cells[cells.length - 1].textContent
}

describe("SidebarNav counters (audit П1–П3)", () => {
  beforeEach(() => localStorage.setItem("mytracker-language", "en"))
  afterEach(cleanup)

  it("matches what Today, Tasks and Goals show", () => {
    const now = new Date().toISOString()
    state.tasks = [
      task({ id: "a", completed: true, completedAt: now }), // done today, no deadline
      task({ id: "b", completed: true, completedAt: "2020-01-01T10:00:00.000Z" }), // done long ago
      task({ id: "c", dueDate: getTodayKey() }), // due today, open
    ]
    state.habits = [
      habit({ id: "h1", completedDates: [getTodayKey()] }),
      habit({ id: "h2", activeDays: [otherWeekday] }), // not scheduled today
    ]
    state.goals = [
      { id: "g1", progress: 40 },
      { id: "g2", progress: 100 },
    ]
    render(
      <MemoryRouter>
        <LanguageProvider>
          <SidebarNav />
        </LanguageProvider>
      </MemoryRouter>,
    )

    // П3: tasks checked off today, same as "done" in the Tasks header
    expect(stat("Tasks done")).toBe("1")
    // П1: only habits scheduled for today, like Today's "1 of 1 today"
    expect(stat("Habits")).toBe("1 / 1")
    // П2: the Goals badge counts active goals, like "Active goals"
    expect(stat("Active goals")).toBe("1")
    const goalsLink = screen.getByRole("link", { name: /Goals/ })
    expect(goalsLink.textContent).toContain("1")
    expect(goalsLink.textContent).not.toContain("2")
  })
})
