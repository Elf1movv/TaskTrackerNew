import { useCallback } from "react"
import { useDrag } from "react-dnd"

// Makes an element a drag source carrying just an id — pairs with
// useDropTarget for "drag this row onto that drop zone" interactions (as
// opposed to useDragReorder, which pairs drag+drop on the same element for
// reordering within one list).
//
// `ref` is memoized (useCallback) so it doesn't get a new identity every
// render — an unstable callback ref makes React detach/reattach the node on
// every render, including mid-drag, which breaks native HTML5 drag mid-gesture.
export function useDragItem<T extends HTMLElement>({
  type,
  id,
  canDrag = true,
}: {
  type: string
  id: string
  // Off in views with nowhere valid to drop the item (e.g. the calendar's
  // Agenda list — a flat list has no day-cell equivalent to drop onto),
  // so the row doesn't pick up and snap back with nothing useful to do.
  canDrag?: boolean
}) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type,
      item: () => ({ id }),
      canDrag,
      collect: monitor => ({ isDragging: monitor.isDragging() }),
    }),
    [type, id, canDrag],
  )

  const ref = useCallback(
    (node: T | null) => {
      drag(node)
    },
    [drag],
  )

  return { ref, isDragging }
}
