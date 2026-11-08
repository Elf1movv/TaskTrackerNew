import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { DndProvider } from "react-dnd"
import { TestBackend } from "react-dnd-test-backend"
import { MemoryRouter } from "react-router"
import type { Goal } from "@/entities/goal"
import { LanguageProvider } from "@/shared/lib/i18n"
import { GoalProgressSummary } from "./GoalProgressSummary"

vi.mock("@/entities/goal", async importOriginal => ({
  ...(await importOriginal<typeof import("@/entities/goal")>()),
  useGoals: () => ({ reorderGoals: vi.fn() }),
}))

const goal = (i: number): Goal => ({
  id: `g${i}`,
  title: `Goal ${i}`,
  description: "",
  progress: 10,
  targetDate: null,
  milestones: [],
  subgoals: [],
  color: "#123456",
  category: null,
  updatedAt: "2026-11-08T00:00:00Z",
})

beforeEach(() => localStorage.setItem("mytracker-language", "en"))
afterEach(cleanup)

describe("Today goal progress", () => {
  it("shows only the first 5 goals, in the given (Goals tab) order", () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <DndProvider backend={TestBackend}>
            <GoalProgressSummary goals={Array.from({ length: 7 }, (_, i) => goal(i + 1))} />
          </DndProvider>
        </LanguageProvider>
      </MemoryRouter>,
    )
    expect(screen.getByText("Goal 1")).toBeTruthy()
    expect(screen.getByText("Goal 5")).toBeTruthy()
    expect(screen.queryByText("Goal 6")).toBeNull()
  })
})
