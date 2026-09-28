import { useCallback } from "react"
import { useDrop } from "react-dnd"

interface DragItem {
  id: string
  durationMinutes?: number
}

// Makes an element accept a drop of a given type and fire once when the
// drag is released on it — pairs with useDragItem. Distinct from
// useDragReorder, which fires continuously on hover to live-reorder a list.
//
// `ref` is memoized (useCallback) so it doesn't get a new identity every
// render — an unstable callback ref makes React detach/reattach the node on
// every render. For a drop target specifically, that reattachment mid-hover
// is what caused drops to silently fail to register (the dragged item
// visually snaps back instead of landing).
//
// `monitor.didDrop()` guards against nested drop targets of the same type
// (e.g. a habit row inside its block's header, which is itself a drop
// target) — react-dnd fires `drop` bottom-up for every matching ancestor,
// so without this check a single drop fires onDrop twice (once for the row,
// once for the header), racing two updates against the same record.
export function useDropTarget<T extends HTMLElement>({
  type,
  onDrop,
}: {
  type: string
  // Second argument is the drop's client (viewport) pixel position, when
  // react-dnd has one — null for e.g. a keyboard-triggered drop. Existing
  // callers that only take `draggedId` simply ignore it; the timeline's
  // per-column drop target is the one consumer that needs it, to turn a
  // drop's Y position into a time-of-day.
  onDrop: (draggedId: string, clientOffset: { x: number; y: number } | null) => void
}) {
  const [{ isOver, clientOffset, draggedItem }, drop] = useDrop<
    DragItem,
    void,
    { isOver: boolean; clientOffset: { x: number; y: number } | null; draggedItem: DragItem | null }
  >(
    () => ({
      accept: type,
      drop: (item, monitor) => {
        if (monitor.didDrop()) return
        onDrop(item.id, monitor.getClientOffset())
      },
      // getClientOffset()/getItem() are live for whichever drop target is
      // under the cursor across the whole page, not scoped to this one —
      // gated on monitor.isOver() so a target the drag isn't currently over
      // doesn't also think it has a live position/item to preview.
      collect: monitor => ({
        isOver: monitor.isOver(),
        clientOffset: monitor.isOver() ? monitor.getClientOffset() : null,
        draggedItem: monitor.isOver() ? monitor.getItem() : null,
      }),
    }),
    [type, onDrop],
  )

  const ref = useCallback(
    (node: T | null) => {
      drop(node)
    },
    [drop],
  )

  return { ref, isOver, clientOffset, draggedItem }
}
