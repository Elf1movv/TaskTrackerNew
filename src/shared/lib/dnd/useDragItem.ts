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
export function useDragItem<T extends HTMLElement>({ type, id }: { type: string; id: string }) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type,
      item: () => ({ id }),
      collect: monitor => ({ isDragging: monitor.isDragging() }),
    }),
    [type, id],
  )

  const ref = useCallback(
    (node: T | null) => {
      drag(node)
    },
    [drag],
  )

  return { ref, isDragging }
}
