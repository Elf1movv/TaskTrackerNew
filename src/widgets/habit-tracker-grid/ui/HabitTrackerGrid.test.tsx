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

function renderGrid() {
  const context = {}
  return render(
    <LanguageProvider>
      <DndProvider backend={TestBackend} context={context}>
        <HabitTrackerGrid habits={[]} />
      </DndProvider>
    </LanguageProvider>,
  )
}

describe("Today habit groups", () => {
  beforeEach(() => {
    localStorage.setItem("mytracker-language", "en")
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

  it("shows an empty group immediately and lets the user add its first habit", () => {
    renderGrid()
    expect(screen.getByText("Morning")).toBeTruthy()
    expect(screen.getByText("No habits in this group yet")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Add habit" }))
    expect(screen.getByRole("textbox")).toBeTruthy()
  })

  it("distinguishes a truly empty group from one with no habits scheduled today", () => {
    state.habits = [
      {
        id: "later",
        title: "Later",
        groupId: "morning",
        activeDays: [],
        completedDates: [],
        icon: "☀️",
        color: "#123456",
        todayOrder: 0,
        createdAt: "2026-10-02T08:00:00.000Z",
        updatedAt: "2026-10-02T08:00:00.000Z",
      },
    ]
    renderGrid()
    expect(screen.getByText("Morning")).toBeTruthy()
    expect(screen.getByText("No habits scheduled for today")).toBeTruthy()
    expect(screen.queryByText("Later")).toBeNull()
    expect(screen.queryByText("No habits in this group yet")).toBeNull()
    expect(screen.getByRole("button", { name: "Add habit" })).toBeTruthy()
  })
})
