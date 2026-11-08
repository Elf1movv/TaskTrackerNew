import { useDragLayer } from "react-dnd"

// True while any item of `type` is being dragged anywhere on the page — lets
// a drop zone that is normally invisible (e.g. an empty, headerless habit
// list on Today) appear only for the duration of a matching drag.
export function useIsDragging(type: string): boolean {
  return useDragLayer(monitor => monitor.isDragging() && monitor.getItemType() === type)
}
