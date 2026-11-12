import { cleanup, render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { LanguageProvider } from "@/shared/lib/i18n"
import { GoalList, type GoalListItem } from "./GoalList"

const { reorderGoals } = vi.hoisted(() => ({ reorderGoals: vi.fn() }))
vi.mock("@/entities/goal", () => ({ useGoals: () => ({ reorderGoals, isLoaded: true }) }))
vi.mock("@/features/goal-form", () => ({ GoalForm: () => null }))
// The real item needs drag-and-drop providers; this test only
// cares about what GoalList itself does with a deep link.
vi.mock("./components", () => ({
  GoalAccordionItem: ({ goal }: { goal: GoalListItem }) => <div data-goal-id={goal.id}>{goal.title}</div>,
}))

const goal = (id: string, title: string) => ({ id, title }) as GoalListItem

describe("GoalList deep link (audit П5)", () => {
  const scrollIntoView = vi.fn()
  beforeEach(() => {
    vi.clearAllMocks()
    Element.prototype.scrollIntoView = scrollIntoView
  })
  afterEach(cleanup)

  it("scrolls to the linked goal and keeps the goal order", () => {
    render(
      <GoalList
        goals={[goal("a", "First"), goal("b", "Second")]}
        initialGoalId="b"
        isAdding={false}
        onCloseAdding={() => {}}
      />,
      { wrapper: LanguageProvider },
    )
    expect(reorderGoals).not.toHaveBeenCalled()
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView.mock.instances[0]).toBe(document.querySelector('[data-goal-id="b"]'))
  })
})
