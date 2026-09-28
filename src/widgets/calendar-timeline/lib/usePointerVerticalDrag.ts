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
export function usePointerVerticalDrag({
  onMove,
  onEnd,
}: {
  onMove: (clientY: number, clientX: number) => void
  onEnd: (clientY: number, clientX: number) => void
}) {
  const activeRef = useRef(false)

  return useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      activeRef.current = true

      function handleMove(ev: PointerEvent) {
        if (activeRef.current) onMove(ev.clientY, ev.clientX)
      }
      function handleUp(ev: PointerEvent) {
        activeRef.current = false
        window.removeEventListener("pointermove", handleMove)
        window.removeEventListener("pointerup", handleUp)
        onEnd(ev.clientY, ev.clientX)
      }
      window.addEventListener("pointermove", handleMove)
      window.addEventListener("pointerup", handleUp)
    },
    [onMove, onEnd],
  )
}
