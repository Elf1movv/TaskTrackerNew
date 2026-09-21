import { DeleteHabitButton } from "@/features/delete-habit"
import { EditHabitButton } from "@/features/edit-habit"
import { HabitCard, HabitListRow } from "@/features/habit-card"
import { useHabits, type Habit } from "@/entities/habit"
import { useDragReorder } from "@/shared/lib/dnd"
import type { HabitViewMode } from "../../lib/habitViewMode"

export function HabitGridItem({
  habit,
  viewMode,
  onEdit,
}: {
  habit: Habit
  viewMode: HabitViewMode
  onEdit: () => void
}) {
  const { reorderHabits } = useHabits()
  const { ref, isDragging } = useDragReorder<HTMLDivElement>({
    type: "habit",
    id: habit.id,
    onHoverMove: reorderHabits,
  })

  return (
    <div
      ref={ref}
      className={`relative group cursor-grab active:cursor-grabbing select-none ${viewMode === "grid" ? "h-full" : ""}`}
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
