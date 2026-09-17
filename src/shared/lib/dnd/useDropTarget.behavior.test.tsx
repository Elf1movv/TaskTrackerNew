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
    drop: (item: { id: string }) => void
  }
  return specFactory()
}

describe("useDropTarget: drop behavior", () => {
  it("builds a drop spec that accepts the given type", () => {
    renderHook(() => useDropTarget({ type: "task", onDrop: () => {} }))

    expect(lastDropSpec().accept).toBe("task")
  })

  it("fires onDrop with the dropped item's id", () => {
    const onDrop = vi.fn()
    renderHook(() => useDropTarget({ type: "task", onDrop }))

    lastDropSpec().drop({ id: "dragged-task" })

    expect(onDrop).toHaveBeenCalledExactlyOnceWith("dragged-task")
  })
})
