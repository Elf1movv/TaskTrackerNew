import { useCallback } from "react"
import { useDrag, useDrop } from "react-dnd"
import { HABIT_MOVE_TYPE } from "./useHabitGroupDnd"

// One habit row on the phone's Habits page (Day and Week, owner 2026-11-18):
// picked up only by its six-dot handle — like notes — so taps on the row
// still mark days and open the habit. Dropping on another row calls
// `onDropHabit(draggedId, thisRowId)` (useHabitGroupDnd's dropHabitOn: same block = reorder, other
// block = move there). Same drag type as the desktop table and Today.
export function useHabitRowDnd(
  habitId: string,
  // Keep it stable (useCallback) — it is a dependency of the drop target.
  onDropHabit: ((draggedId: string, targetId: string) => void) | undefined,
) {
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: HABIT_MOVE_TYPE,
      item: () => ({ id: habitId }),
      collect: monitor => ({ isDragging: monitor.isDragging() }),
    }),
    [habitId],
  )
  const [{ isOver }, drop] = useDrop<{ id: string }, void, { isOver: boolean }>(
    () => ({
      accept: HABIT_MOVE_TYPE,
      drop: (item, monitor) => {
        if (monitor.didDrop() || item.id === habitId) return
        onDropHabit?.(item.id, habitId)
      },
      collect: monitor => ({ isOver: monitor.isOver({ shallow: true }) }),
    }),
    [habitId, onDropHabit],
  )

  // Stable callback refs: a new identity every render would detach the node
  // mid-drag (see shared/lib/dnd/useDragReorder.ts).
  const handleRef = useCallback((node: HTMLElement | null) => void drag(node), [drag])
  const rowRef = useCallback((node: HTMLElement | null) => void preview(drop(node)), [preview, drop])

  return { handleRef, rowRef, isDragging, isOver }
}
