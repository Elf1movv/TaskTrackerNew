import { useCallback, useRef } from "react"
import { useDrag, useDrop } from "react-dnd"

interface DragItem {
  id: string
}

// Generic drag-to-reorder wiring for a single list row/card. `type` scopes
// drag/drop pairing to one list (e.g. "task", "goal") so unrelated lists on
// the same screen never accept each other's drags. Reordering happens live
// while hovering, matching the common react-dnd sortable-list pattern.
//
// `ref` is a callback ref (not a useRef object): react-dnd's `drag`/`drop`
// connector functions must run when React attaches/detaches the DOM node,
// not read a ref's `.current` during render — reading `.current` in the
// render body is what react-hooks/refs (React 19) flags as unsafe. It is
// wrapped in useCallback so its identity stays stable across re-renders —
// an inline (non-memoized) callback ref gets a new identity every render,
// which makes React detach and reattach the DOM node every time, including
// mid-gesture while a drag is in progress. That reattachment churn is what
// broke drag reliability (drops not registering, snapping back).
export function useDragReorder<T extends HTMLElement>({
  type,
  id,
  onHoverMove,
}: {
  type: string
  id: string
  onHoverMove: (draggedId: string, targetId: string) => void
}) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type,
      item: (): DragItem => ({ id }),
      collect: monitor => ({ isDragging: monitor.isDragging() }),
    }),
    [type, id],
  )

  // react-dnd's `hover` fires on nearly every pointer-move tick while the
  // drag stays over this target, not just once when it actually arrives —
  // without this guard, hovering a single target for a moment calls
  // onHoverMove (and downstream, fires a real API request) dozens of times
  // for the exact same move. This tracks the last dragged item already
  // moved next to this target and skips repeats; a different drag (new
  // `item.id`) naturally passes again.
  const lastMovedIdRef = useRef<string | null>(null)

  const [, drop] = useDrop<DragItem>(
    () => ({
      accept: type,
      hover: item => {
        if (item.id === id || lastMovedIdRef.current === item.id) return
        lastMovedIdRef.current = item.id
        onHoverMove(item.id, id)
      },
    }),
    [type, id, onHoverMove],
  )

  const ref = useCallback(
    (node: T | null) => {
      drag(drop(node))
    },
    [drag, drop],
  )

  return { ref, isDragging }
}
