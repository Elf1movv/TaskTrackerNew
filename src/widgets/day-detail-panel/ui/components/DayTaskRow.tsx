import { DeleteTaskButton } from "@/features/delete-task"
import { EditTaskButton } from "@/features/edit-task"
import { TaskToggleCheckbox } from "@/features/toggle-task"
import { PriorityDot, type Task } from "@/entities/task"
import { useDragItem } from "@/shared/lib/dnd"

// Drag source only (see useDragItem vs useDragReorder): dragging this row
// onto a day cell in CalendarGrid moves the task to that day — it doesn't
// reorder within this panel's own list.
export function DayTaskRow({ task, onEdit }: { task: Task; onEdit: () => void }) {
  const { ref, isDragging } = useDragItem<HTMLDivElement>({ type: "calendar-task-move", id: task.id })

  return (
    <div
      ref={ref}
      className="w-full flex items-start gap-2.5 text-left group cursor-grab active:cursor-grabbing select-none"
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <TaskToggleCheckbox taskId={task.id} completed={task.completed} size={16} />
      <span
        className={`text-sm flex-1 text-left leading-snug ${
          task.completed ? "line-through text-muted-foreground" : ""
        }`}
      >
        {task.title}
      </span>
      <PriorityDot priority={task.priority} />
      <EditTaskButton onClick={onEdit} />
      <DeleteTaskButton taskId={task.id} />
    </div>
  )
}
