import { renderHook } from "@testing-library/react"
import * as reactDnd from "react-dnd"
import { describe, expect, it, vi } from "vitest"
import { useDropTarget } from "./useDropTarget"

// react-dnd's own hover/drop wiring is its responsibility to get right, not
// ours to re-verify — so instead of driving a real (or simulated) drag
// through react-dnd's internal handler registry, we mock react-dnd's public
// useDrag/useDrop API and call the spec object our hook builds directly.
// This isolates and tests exactly the one piece of logic that's actually
// ours: what onDrop gets called with.
vi.mock("react-dnd", () => ({
  useDrop: vi.fn(() => [{ isOver: false }, vi.fn()]),
}))

function lastDropSpec() {
  const calls = vi.mocked(reactDnd.useDrop).mock.calls
  const specFactory = calls[calls.length - 1][0] as unknown as () => {
    accept: string
    drop: (item: { id: string }, monitor: { didDrop: () => boolean }) => void
  }
  return specFactory()
}

// A drop target nested inside another drop target of the same type (a habit
// row inside its block's header) still gets `didDrop: () => false` from the
// real react-dnd monitor on the innermost target — only an ancestor target
// that already handled the same drop sees `true`.
const notYetHandled = { didDrop: () => false }

describe("useDropTarget: drop behavior", () => {
  it("builds a drop spec that accepts the given type", () => {
    renderHook(() => useDropTarget({ type: "task", onDrop: () => {} }))

    expect(lastDropSpec().accept).toBe("task")
  })

  it("fires onDrop with the dropped item's id", () => {
    const onDrop = vi.fn()
    renderHook(() => useDropTarget({ type: "task", onDrop }))

    lastDropSpec().drop({ id: "dragged-task" }, notYetHandled)

    expect(onDrop).toHaveBeenCalledExactlyOnceWith("dragged-task")
  })

  it("does not fire onDrop when a nested target already handled the drop", () => {
    const onDrop = vi.fn()
    renderHook(() => useDropTarget({ type: "task", onDrop }))

    lastDropSpec().drop({ id: "dragged-task" }, { didDrop: () => true })

    expect(onDrop).not.toHaveBeenCalled()
  })
})
