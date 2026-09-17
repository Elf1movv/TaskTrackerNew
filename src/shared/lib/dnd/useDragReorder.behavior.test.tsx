import { renderHook } from "@testing-library/react"
import * as reactDnd from "react-dnd"
import { describe, expect, it, vi } from "vitest"
import { useDragReorder } from "./useDragReorder"

// See useDropTarget.behavior.test.tsx for why react-dnd itself is mocked
// here instead of driven through its real handler registry — this isolates
// the one line of business logic that's actually ours: the self-hover guard
// (`if (item.id !== id)`), which is what decides whether a row reorders
// against itself or against a genuinely different row.
vi.mock("react-dnd", () => ({
  useDrag: vi.fn(() => [{ isDragging: false }, vi.fn()]),
  useDrop: vi.fn(() => [{}, vi.fn()]),
}))

function lastHoverSpec() {
  const calls = vi.mocked(reactDnd.useDrop).mock.calls
  const specFactory = calls[calls.length - 1][0] as unknown as () => {
    hover: (item: { id: string }) => void
  }
  return specFactory()
}

describe("useDragReorder: hover behavior", () => {
  it("calls onHoverMove(draggedId, targetId) when a different row is dragged over it", () => {
    const onHoverMove = vi.fn()
    renderHook(() => useDragReorder({ type: "task", id: "b", onHoverMove }))

    lastHoverSpec().hover({ id: "a" })

    expect(onHoverMove).toHaveBeenCalledExactlyOnceWith("a", "b")
  })

  it("does not call onHoverMove when a row hovers over its own drop target", () => {
    const onHoverMove = vi.fn()
    renderHook(() => useDragReorder({ type: "task", id: "a", onHoverMove }))

    lastHoverSpec().hover({ id: "a" })

    expect(onHoverMove).not.toHaveBeenCalled()
  })
})
