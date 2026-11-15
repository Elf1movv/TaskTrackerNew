import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { usePointerVerticalDrag } from "./usePointerVerticalDrag"

function pointer(type: string, pointerId: number, clientY = 0) {
  return Object.assign(new Event(type), { pointerId, clientY, clientX: 0 })
}

function start(onDown: (e: React.PointerEvent) => void, pointerId: number) {
  onDown({ pointerId, currentTarget: { setPointerCapture: () => {} } } as unknown as React.PointerEvent)
}

describe("usePointerVerticalDrag", () => {
  it("ends the gesture on pointerup", () => {
    const onEnd = vi.fn()
    const { result } = renderHook(() => usePointerVerticalDrag({ onMove: vi.fn(), onEnd, onCancel: vi.fn() }))
    start(result.current, 1)
    window.dispatchEvent(pointer("pointerup", 1, 120))
    expect(onEnd).toHaveBeenCalledWith(120, 0)
  })

  // Owner report 2026-11-15: a finger that started on a day column and then
  // scrolled the page left the gesture half-open; the next tap anywhere (the
  // "Week" button) opened the new-plan window.
  it("a browser-cancelled gesture is over: a later tap elsewhere does nothing", () => {
    const onEnd = vi.fn()
    const onCancel = vi.fn()
    const { result } = renderHook(() => usePointerVerticalDrag({ onMove: vi.fn(), onEnd, onCancel }))
    start(result.current, 1)
    window.dispatchEvent(pointer("pointercancel", 1))
    window.dispatchEvent(pointer("pointerup", 1))
    window.dispatchEvent(pointer("pointerup", 2))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onEnd).not.toHaveBeenCalled()
  })

  it("ignores another finger's pointerup", () => {
    const onEnd = vi.fn()
    const { result } = renderHook(() => usePointerVerticalDrag({ onMove: vi.fn(), onEnd, onCancel: vi.fn() }))
    start(result.current, 1)
    window.dispatchEvent(pointer("pointerup", 2))
    expect(onEnd).not.toHaveBeenCalled()
    window.dispatchEvent(pointer("pointerup", 1))
    expect(onEnd).toHaveBeenCalledTimes(1)
  })
})
