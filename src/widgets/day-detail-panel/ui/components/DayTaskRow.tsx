import { EditTaskButton } from "@/features/edit-task"
import { PlanToggleCheckbox as TaskToggleCheckbox } from "@/features/toggle-plan"
import type { CalendarEntry as Task } from "@/entities/calendar-plan"
import { useDragItem } from "@/shared/lib/dnd"

// Drag source only (see useDragItem vs useDragReorder): dragging this row
// onto a day cell in CalendarGrid moves the task to that day — it doesn't
// reorder within this panel's own list. `draggable=false` for callers with
// no day-cell equivalent to drop onto (the calendar's Agenda list).
export function DayTaskRow({
  task,
  onEdit,
  draggable = true,
}: {
  task: Task
  onEdit: () => void
  draggable?: boolean
}) {
  const { ref, isDragging } = useDragItem<HTMLDivElement>({
    type: "calendar-task-move",
    id: task.id,
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
      <TaskToggleCheckbox taskId={task.id} completed={task.completed} size={22} />
      <span
        className={`text-sm font-semibold flex-1 text-left leading-snug ${
          task.completed ? "line-through text-tertiary" : ""
        }`}
      >
        {task.title}
      </span>
      <EditTaskButton onClick={onEdit} />
    </div>
  )
}
