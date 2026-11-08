import { useCallback, useRef, useState } from "react"
import { parseISO } from "date-fns"
import { minutesFromMidnight, offsetPxToTime, offsetToTime } from "@/shared/lib/timeOffset"
import { usePointerVerticalDrag } from "./usePointerVerticalDrag"

// A movement smaller than this many pixels is treated as "just a tap" —
// the browser still fires a `click` right after `pointerup` regardless of
// whether the pointer moved, so the block's own onClick (open the edit
// popover) handles that case on its own; this hook only needs to know
// whether it should intercept and suppress that upcoming click because a
// real move already happened (see `wasDraggedRef`).
const DRAG_THRESHOLD_PX = 6

export interface MoveDragPreview {
  day: string // formatDateKey ("yyyy-MM-dd") of the column currently under the pointer
  startTime: string
  endTime: string
}

// Drags a whole task block to a new time (and, in Week view, a new day) —
// replaces what used to be react-dnd's whole-block move. react-dnd here
// meant HTML5Backend, and native HTML5 drag-and-drop simply doesn't fire
// from touch input on mobile browsers (a long-standing, well-documented
// platform limitation, not something react-dnd itself can paper over) —
// direct feedback, 2026-09-28, after the calendar's resize/create-drag
// gestures (already Pointer-Events-based, see useResizeDrag.ts/
// useCreateDrag.ts) turned out to be the only two gestures on this grid
// that actually worked reliably on the user's phone. This hook follows
// that same, already-proven pattern instead.
//
// Unlike resize (always the same day, only the end time moves), a move
// can land in a DIFFERENT day column than the one the drag started in
// (dragging Monday's 14:00 task onto Wednesday in Week view) — so this
// can't just measure against one fixed column's rect the way
// useResizeDrag does. Instead, on every move/end it asks the DOM directly
// which column is currently under the pointer via
// `document.elementFromPoint` + `.closest("[data-calendar-day]")` (see
// HourGrid.tsx's TimelineDayColumn, which tags its own root node with
// that attribute) — this works identically whether the pointer is over
// empty grid background or another block, and needs no column refs
// threaded down from HourGrid.
export function useMoveDrag({
  taskId,
  durationMinutes,
  onRescheduleTask,
  onPreviewChange,
}: {
  taskId: string
  durationMinutes: number
  onRescheduleTask: (taskId: string, day: Date, time: string) => void
  onPreviewChange: (preview: MoveDragPreview | null) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const startPointRef = useRef<{ x: number; y: number } | null>(null)
  // Doubles as "did the gesture that just ended count as a real drag" —
  // read by the block's onClick right after pointerup (the browser fires
  // click there regardless of movement) to decide whether to suppress
  // itself. Intentionally NOT reset at the end of handleEnd — onClick
  // needs to still see it, and it gets reset on the next pointerdown
  // instead. A ref, not state: handleMove is registered once per gesture
  // (see usePointerVerticalDrag) and would otherwise read back a stale
  // isDragging from the render it was created in.
  const draggedRef = useRef(false)

  const computeAt = useCallback(
    (clientX: number, clientY: number): MoveDragPreview | null => {
      const columnEl = (
        document.elementFromPoint(clientX, clientY) as HTMLElement | null
      )?.closest<HTMLElement>("[data-calendar-day]")
      const day = columnEl?.dataset.calendarDay
      if (!day) return null
      const rect = columnEl.getBoundingClientRect()
      const startTime = offsetPxToTime(clientY - rect.top)
      const endTime = offsetToTime(minutesFromMidnight(startTime) + durationMinutes)
      return { day, startTime, endTime }
    },
    [durationMinutes],
  )

  const handleMove = useCallback(
    (clientY: number, clientX: number) => {
      const start = startPointRef.current
      if (!start) return
      if (!draggedRef.current) {
        if (Math.hypot(clientX - start.x, clientY - start.y) < DRAG_THRESHOLD_PX) return
        draggedRef.current = true
        setIsDragging(true)
      }
      onPreviewChange(computeAt(clientX, clientY))
    },
    [computeAt, onPreviewChange],
  )

  const handleEnd = useCallback(
    (clientY: number, clientX: number) => {
      startPointRef.current = null
      setIsDragging(false)
      onPreviewChange(null)
      if (draggedRef.current) {
        const target = document.elementFromPoint(clientX, clientY) as HTMLElement | null
        if (target?.closest("[data-plan-hold]")) {
          window.dispatchEvent(new CustomEvent("calendar-plan-drop", { detail: { id: taskId } }))
          return
        }
        const dayTarget = target?.closest<HTMLElement>("[data-plan-day]")
        if (dayTarget?.dataset.planDay) {
          window.dispatchEvent(
            new CustomEvent("calendar-plan-drop", { detail: { id: taskId, day: dayTarget.dataset.planDay } }),
          )
          return
        }
        const result = computeAt(clientX, clientY)
        if (result) onRescheduleTask(taskId, parseISO(result.day), result.startTime)
      }
    },
    [computeAt, onPreviewChange, onRescheduleTask, taskId],
  )

  const onPointerDownRaw = usePointerVerticalDrag({ onMove: handleMove, onEnd: handleEnd })

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      draggedRef.current = false
      startPointRef.current = { x: e.clientX, y: e.clientY }
      onPointerDownRaw(e)
    },
    [onPointerDownRaw],
  )

  return { onPointerDown, isDragging, wasDraggedRef: draggedRef }
}
