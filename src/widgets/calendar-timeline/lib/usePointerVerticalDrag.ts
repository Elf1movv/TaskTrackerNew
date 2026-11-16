import { useCallback, useRef } from "react"

// Pure pointer-drag mechanics shared by create-drag (HourGrid's column
// background), resize-drag (a task block's bottom-edge handle), and
// move-drag (dragging a whole task block to a new time/day). Pointer
// Events, not mouse events, with pointer capture on the gesture's origin
// element — so the drag keeps being tracked even if the cursor leaves the
// scrollable grid container (`overflow-auto`) mid-gesture, which plain
// mouse events don't guarantee. No time/pixel semantics here at all —
// just reports the pointer's clientY (and clientX, needed by move-drag to
// find which day column the pointer is over — create/resize only ever
// care about Y and simply ignore it) on every move and at the end;
// callers derive whatever pixel-to-time math they need from that.
//
// `pointercancel` (2026-11-15): on a phone, a finger that lands on a day
// column and then slides is taken over by the browser as a page/grid scroll —
// it sends pointercancel, never pointerup. Before, that left the listeners
// below attached and the gesture "half-open", so the NEXT tap anywhere (e.g.
// the "Week" button) counted as its end and opened the new-plan window
// (owner report). A cancel now ends the gesture without a result (`onCancel`).
export function usePointerVerticalDrag({
  onMove,
  onEnd,
  onCancel,
}: {
  onMove: (clientY: number, clientX: number) => void
  onEnd: (clientY: number, clientX: number) => void
  onCancel: () => void
}) {
  // Removes the current gesture's window listeners; also run at the start of
  // a new gesture, so nothing from an earlier one can ever linger.
  const cleanupRef = useRef<(() => void) | null>(null)

  return useCallback(
    (e: React.PointerEvent) => {
      cleanupRef.current?.()
      e.currentTarget.setPointerCapture(e.pointerId)
      const pointerId = e.pointerId

      function cleanup() {
        window.removeEventListener("pointermove", handleMove)
        window.removeEventListener("pointerup", handleUp)
        window.removeEventListener("pointercancel", handleCancel)
        cleanupRef.current = null
      }
      function handleMove(ev: PointerEvent) {
        if (ev.pointerId === pointerId) onMove(ev.clientY, ev.clientX)
      }
      function handleUp(ev: PointerEvent) {
        if (ev.pointerId !== pointerId) return
        cleanup()
        onEnd(ev.clientY, ev.clientX)
      }
      function handleCancel(ev: PointerEvent) {
        if (ev.pointerId !== pointerId) return
        cleanup()
        onCancel()
      }
      window.addEventListener("pointermove", handleMove)
      window.addEventListener("pointerup", handleUp)
      window.addEventListener("pointercancel", handleCancel)
      cleanupRef.current = cleanup
    },
    [onMove, onEnd, onCancel],
  )
}
