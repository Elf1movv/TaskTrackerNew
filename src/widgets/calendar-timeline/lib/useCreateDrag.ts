import { useCallback, useRef, useState, type RefObject } from "react"
import {
  DEFAULT_BLOCK_MINUTES,
  minutesFromMidnight,
  offsetPxToTime,
  offsetToTime,
  timeToOffsetPx,
} from "@/shared/lib/timeOffset"
import { usePointerVerticalDrag } from "./usePointerVerticalDrag"

// A drag shorter than this many minutes (measured after snapping) is
// treated as "essentially a click" — the exact gesture confirmed with the
// user: press-and-drag-down defines a range, but a plain click still
// creates a sensible default block instead of a useless zero-length one.
const CLICK_FALLBACK_MINUTES = 15

export interface CreateDragPreview {
  startTime: string
  endTime: string
}

// Click/drag-to-create on an empty area of an hour-grid day column.
// Stretches only downward from the press point, per the confirmed gesture
// — dragging back up past the anchor just clamps the preview to
// zero-length rather than flipping the range. `columnRef` must point at
// the same column element the existing whole-block move drop target uses
// (see TimelineDayColumn), since the Y-to-time math needs the column's
// own top edge as its reference frame — the same inverse of the
// offsetPxToTime(clientOffset.y - rect.top) math the existing move
// drop-target already uses.
export function useCreateDrag({
  columnRef,
  onCreateDraft,
}: {
  columnRef: RefObject<HTMLDivElement | null>
  onCreateDraft: (startTime: string, endTime: string, anchorRect: DOMRect) => void
}) {
  // Not reactive state — only `preview` needs to trigger a re-render (to
  // paint the live preview block); the anchor itself is write-once-per-
  // gesture and read-only from event handlers, a ref avoids threading it
  // through as a dependency of handleMove/handleEnd.
  const anchorTimeRef = useRef<string | null>(null)
  const [preview, setPreview] = useState<CreateDragPreview | null>(null)

  const timeAtClientY = useCallback(
    (clientY: number) => {
      const rect = columnRef.current?.getBoundingClientRect()
      if (!rect) return null
      return offsetPxToTime(clientY - rect.top)
    },
    [columnRef],
  )

  const handleMove = useCallback(
    (clientY: number) => {
      const start = anchorTimeRef.current
      if (!start) return
      const candidate = timeAtClientY(clientY)
      const endTime =
        candidate && minutesFromMidnight(candidate) > minutesFromMidnight(start) ? candidate : start
      setPreview({ startTime: start, endTime })
    },
    [timeAtClientY],
  )

  const handleEnd = useCallback(
    (clientY: number) => {
      const start = anchorTimeRef.current
      anchorTimeRef.current = null
      setPreview(null)
      if (!start) return
      const rect = columnRef.current?.getBoundingClientRect()
      if (!rect) return

      const candidate = timeAtClientY(clientY) ?? start
      const durationMinutes = minutesFromMidnight(candidate) - minutesFromMidnight(start)
      const endTime =
        durationMinutes >= CLICK_FALLBACK_MINUTES
          ? candidate
          : offsetToTime(minutesFromMidnight(start) + DEFAULT_BLOCK_MINUTES)

      const startTopPx = timeToOffsetPx(start)
      const endTopPx = timeToOffsetPx(endTime)
      const anchorRect = new DOMRect(rect.left, rect.top + startTopPx, rect.width, endTopPx - startTopPx)
      onCreateDraft(start, endTime, anchorRect)
    },
    [columnRef, onCreateDraft, timeAtClientY],
  )

  const onPointerDownRaw = usePointerVerticalDrag({ onMove: handleMove, onEnd: handleEnd })

  // Only ever fires when the gesture starts on the column's own
  // background — an existing block's own onPointerDown calls
  // stopPropagation, so this handler (attached to the column, an
  // ancestor) never sees a pointerdown that started on a block.
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const start = timeAtClientY(e.clientY)
      if (!start) return
      anchorTimeRef.current = start
      setPreview({ startTime: start, endTime: start })
      onPointerDownRaw(e)
    },
    [timeAtClientY, onPointerDownRaw],
  )

  return { onPointerDown, preview }
}
