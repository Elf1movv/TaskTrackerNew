import { DeleteGoalButton } from "@/features/delete-goal"
import { EditGoalButton } from "@/features/edit-goal"
import { type Goal } from "@/entities/goal"
import { useDragItem } from "@/shared/lib/dnd"
import { monoFont } from "@/shared/lib/typography"

// Mirrors DayTaskRow exactly — drag source only, dragging onto a day cell
// moves this goal's deadline there (see moveGoalDeadline in
// CalendarProvider). Type "calendar-goal-move", separate from Task's
// "calendar-task-move" so the two never cross-accept each other's drops.
// `draggable=false` for callers with no day-cell equivalent (Agenda).
export function DayGoalRow({
  goal,
  onEdit,
  draggable = true,
}: {
  goal: Goal
  onEdit: () => void
  draggable?: boolean
}) {
  const { ref, isDragging } = useDragItem<HTMLDivElement>({
    type: "calendar-goal-move",
    id: goal.id,
    canDrag: draggable,
  })

  return (
    <div
      ref={ref}
      className={`w-full flex items-start gap-2.5 text-left group select-none ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <span className="text-sm flex-1 text-left leading-snug">{goal.title}</span>
      <span css={monoFont} className="text-xs text-muted-foreground shrink-0">
        {goal.progress}%
      </span>
      <EditGoalButton onClick={onEdit} />
      <DeleteGoalButton goalId={goal.id} />
    </div>
  )
}
