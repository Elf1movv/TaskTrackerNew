import { useCallback, useState, type RefObject } from "react"
import { addMinutesToTime, minutesFromMidnight, offsetPxToTime } from "@/shared/lib/timeOffset"
import { usePointerVerticalDrag } from "./usePointerVerticalDrag"

// Floor so a resize can never collapse a block to zero/negative duration
// — matches the grid's own 15-minute snap granularity.
const MIN_DURATION_MINUTES = 15

// The drag on a task block's bottom-edge handle — start time is fixed,
// only how far the block stretches changes. `draftEndTime` is a live
// local preview during the gesture; the actual `onResizeTask` commit only
// fires once, on release.
export function useResizeDrag({
  startTime,
  columnRef,
  onResizeTask,
}: {
  startTime: string
  columnRef: RefObject<HTMLDivElement | null>
  onResizeTask: (endTime: string) => void
}) {
  const [draftEndTime, setDraftEndTime] = useState<string | null>(null)

  const clampedEndTimeAtClientY = useCallback(
    (clientY: number) => {
      const rect = columnRef.current?.getBoundingClientRect()
      if (!rect) return null
      const candidate = offsetPxToTime(clientY - rect.top)
      const minEnd = addMinutesToTime(startTime, MIN_DURATION_MINUTES)
      return minutesFromMidnight(candidate) > minutesFromMidnight(minEnd) ? candidate : minEnd
    },
    [columnRef, startTime],
  )

  const handleMove = useCallback(
    (clientY: number) => {
      const clamped = clampedEndTimeAtClientY(clientY)
      if (clamped) setDraftEndTime(clamped)
    },
    [clampedEndTimeAtClientY],
  )

  const handleEnd = useCallback(
    (clientY: number) => {
      const clamped = clampedEndTimeAtClientY(clientY)
      setDraftEndTime(null)
      if (clamped) onResizeTask(clamped)
    },
    [clampedEndTimeAtClientY, onResizeTask],
  )

  const onPointerDownRaw = usePointerVerticalDrag({ onMove: handleMove, onEnd: handleEnd })

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Must not also trigger the block's own whole-move drag (react-dnd,
      // started via native HTML5 dragstart on the parent) or its
      // click-to-edit — both stopPropagation and preventDefault are
      // needed since dragstart is a separate native event this doesn't
      // otherwise intercept.
      e.stopPropagation()
      e.preventDefault()
      onPointerDownRaw(e)
    },
    [onPointerDownRaw],
  )

  return { onPointerDown, draftEndTime }
}
