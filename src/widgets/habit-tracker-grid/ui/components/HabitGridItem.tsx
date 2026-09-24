import { useCallback } from "react"
import { DeleteHabitButton } from "@/features/delete-habit"
import { EditHabitButton } from "@/features/edit-habit"
import { HabitCard, HabitListRow } from "@/features/habit-card"
import { type Habit } from "@/entities/habit"
import { useDragItem, useDropTarget } from "@/shared/lib/dnd"
import type { HabitViewMode } from "../../lib/habitViewMode"

// One habit's card/row within its block's card on Today — drag source and
// drop target for type "habit-move-today" (separate from /habits' own
// "habit-move" type, see TodayHabitGroupCard), so this axis's reordering
// never crosses over into the /habits page's independent one.
export function HabitGridItem({
  habit,
  viewMode,
  onDropHabit,
  onEdit,
}: {
  habit: Habit
  viewMode: HabitViewMode
  onDropHabit: (draggedId: string) => void
  onEdit: () => void
}) {
  const { ref: dragRef, isDragging } = useDragItem<HTMLDivElement>({ type: "habit-move-today", id: habit.id })
  const { ref: dropRef, isOver } = useDropTarget<HTMLDivElement>({
    type: "habit-move-today",
    onDrop: onDropHabit,
  })
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      dragRef(node)
      dropRef(node)
    },
    [dragRef, dropRef],
  )

  return (
    <div
      ref={ref}
      className={`relative group cursor-grab active:cursor-grabbing select-none rounded-2xl ${viewMode === "grid" ? "h-full" : ""} ${isOver ? "ring-2 ring-primary/40" : ""}`}
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      {viewMode === "grid" ? <HabitCard habit={habit} /> : <HabitListRow habit={habit} />}
      <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
        <EditHabitButton onClick={onEdit} />
        <DeleteHabitButton habitId={habit.id} />
      </div>
    </div>
  )
}
