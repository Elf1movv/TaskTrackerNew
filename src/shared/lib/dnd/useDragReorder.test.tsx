import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { makeDndWrapper } from "./dndTestUtils"
import { useDragReorder } from "./useDragReorder"

// Regression guard — see useDragItem.test.tsx for why this matters. Both
// useDrag and useDrop live inside this one hook, so a stable ref here
// covers both halves of the wiring.
describe("useDragReorder: ref stability", () => {
  it("returns a stable ref callback across re-renders with unchanged props", () => {
    const { result, rerender } = renderHook(
      () => useDragReorder({ type: "task", id: "a", onHoverMove: () => {} }),
      { wrapper: makeDndWrapper(() => {}) },
    )
    const firstRef = result.current.ref

    rerender()

    expect(result.current.ref).toBe(firstRef)
  })
})
