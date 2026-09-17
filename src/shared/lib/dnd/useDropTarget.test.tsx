import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { makeDndWrapper } from "./dndTestUtils"
import { useDropTarget } from "./useDropTarget"

// Regression guard — see useDragItem.test.tsx for why this matters.
describe("useDropTarget: ref stability", () => {
  it("returns a stable ref callback across re-renders with unchanged props", () => {
    const { result, rerender } = renderHook(() => useDropTarget({ type: "task", onDrop: () => {} }), {
      wrapper: makeDndWrapper(() => {}),
    })
    const firstRef = result.current.ref

    rerender()

    expect(result.current.ref).toBe(firstRef)
  })
})
