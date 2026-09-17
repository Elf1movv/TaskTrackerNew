import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { makeDndWrapper } from "./dndTestUtils"
import { useDragItem } from "./useDragItem"

// Regression guard for the callback-ref-instability bug documented in
// docs/ARCHITECTURE.md: an unmemoized ref callback gets a new function
// identity on every render, which makes React detach and reattach the DOM
// node — including mid-drag — breaking drag-and-drop. If someone ever
// removes the useCallback wrapping the returned ref, this test fails.
describe("useDragItem", () => {
  it("returns a stable ref callback across re-renders with unchanged props", () => {
    const { result, rerender } = renderHook(() => useDragItem({ type: "task", id: "a" }), {
      wrapper: makeDndWrapper(() => {}),
    })
    const firstRef = result.current.ref

    rerender()

    expect(result.current.ref).toBe(firstRef)
  })

  it("is not dragging by default", () => {
    const { result } = renderHook(() => useDragItem({ type: "task", id: "a" }), {
      wrapper: makeDndWrapper(() => {}),
    })

    expect(result.current.isDragging).toBe(false)
  })
})
