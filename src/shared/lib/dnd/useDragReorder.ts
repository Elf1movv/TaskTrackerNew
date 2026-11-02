import { useCallback } from "react"
import { useDrag, useDrop } from "react-dnd"

interface DragItem {
  id: string
  lastTargetId?: string
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
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type,
      item: (): DragItem => ({ id }),
      collect: monitor => ({ isDragging: monitor.isDragging() }),
    }),
    [type, id],
  )

  // Keep the last target on this drag's item, not on the mounted row:
  // repeated hover ticks are ignored, but a new drag (or returning from
  // another target) can move the same note/milestone again.
  const [, drop] = useDrop<DragItem>(
    () => ({
      accept: type,
      hover: item => {
        if (item.id === id || item.lastTargetId === id) return
        item.lastTargetId = id
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

  // Lists with interactive content can attach dragging only to a handle.
  const handleRef = useCallback(
    (node: HTMLButtonElement | null) => {
      drag(node)
    },
    [drag],
  )
  const dropRef = useCallback(
    (node: T | null) => {
      preview(drop(node))
    },
    [drop, preview],
  )
  return { ref, handleRef, dropRef, isDragging }
}
