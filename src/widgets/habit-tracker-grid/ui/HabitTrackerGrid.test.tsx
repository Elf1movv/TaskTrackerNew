import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { DndProvider } from "react-dnd"
import { TestBackend } from "react-dnd-test-backend"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Habit } from "@/entities/habit"
import type { HabitGroup } from "@/entities/habit-group"
import { LanguageProvider } from "@/shared/lib/i18n"
import { HabitTrackerGrid } from "./HabitTrackerGrid"

const state = vi.hoisted(() => ({ groups: [] as HabitGroup[], habits: [] as Habit[] }))
vi.mock("@/entities/habit-group", async importOriginal => ({
  ...(await importOriginal<typeof import("@/entities/habit-group")>()),
  useHabitGroups: () => ({
    habitGroups: state.groups,
    reorderHabitGroups: vi.fn(),
    deleteHabitGroup: vi.fn(),
  }),
}))
vi.mock("@/entities/habit", async importOriginal => ({
  ...(await importOriginal<typeof import("@/entities/habit")>()),
  useHabits: () => ({
    habits: state.habits,
    reorderHabitsToday: vi.fn(),
    moveHabitToGroupToday: vi.fn(),
    refreshHabits: vi.fn(),
  }),
}))

function habit(patch: Partial<Habit>): Habit {
  return {
    id: "h",
    title: "Habit",
    groupId: "morning",
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    completedDates: [],
    icon: "☀️",
    color: "#123456",
    todayOrder: 0,
    createdAt: "2026-10-02T08:00:00.000Z",
    updatedAt: "2026-10-02T08:00:00.000Z",
    ...patch,
  } as Habit
}

function renderGrid(habits: Habit[] = []) {
  const context = {}
  return render(
    <LanguageProvider>
      <DndProvider backend={TestBackend} context={context}>
        <HabitTrackerGrid habits={habits} />
      </DndProvider>
    </LanguageProvider>,
  )
}

describe("Today habit groups", () => {
  beforeEach(() => {
    localStorage.setItem("mytracker-language", "en")
    sessionStorage.clear()
    state.groups = [
      {
        id: "morning",
        title: "Morning",
        icon: "☀️",
        color: "#123456",
        isGeneral: false,
        updatedAt: "2026-10-02T08:00:00.000Z",
      },
    ]
    state.habits = []
  })
  afterEach(cleanup)

  it("starts with blocks collapsed and remembers an opened block for the session", () => {
    renderGrid()
    expect(screen.getByText("Morning")).toBeTruthy()
    expect(screen.queryByText("No habits in this group yet")).toBeNull()
    fireEvent.click(screen.getByText("Morning"))
    expect(screen.getByText("No habits in this group yet")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Add habit" }))
    expect(screen.getByRole("textbox")).toBeTruthy()
    cleanup()
    renderGrid()
    expect(screen.getByText("No habits in this group yet")).toBeTruthy()
  })

  it("distinguishes a truly empty group from one with no habits scheduled today", () => {
    state.habits = [habit({ id: "later", title: "Later", groupId: "morning", activeDays: [] })]
    renderGrid()
    fireEvent.click(screen.getByText("Morning"))
    expect(screen.getByText("No habits scheduled for today")).toBeTruthy()
    expect(screen.queryByText("Later")).toBeNull()
    expect(screen.queryByText("No habits in this group yet")).toBeNull()
    expect(screen.getByRole("button", { name: "Add habit" })).toBeTruthy()
  })

  it("shows habits without a block as a plain list, without the General header", () => {
    state.groups = [
      { ...state.groups[0], id: "general", title: "General", icon: "📋", isGeneral: true },
      ...state.groups,
    ]
    const water = habit({ id: "water", title: "Water", groupId: "general" })
    state.habits = [water]
    renderGrid([water])
    expect(document.querySelector("[data-general-habits]")?.textContent).toContain("Water")
    expect(screen.queryByText("General")).toBeNull()
    expect(screen.queryByText("Default")).toBeNull()
  })
})
