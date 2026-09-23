import { DeleteTaskButton } from "@/features/delete-task"
import { EditTaskButton } from "@/features/edit-task"
import { TaskToggleCheckbox } from "@/features/toggle-task"
import { PriorityDot, useTasks, type Task } from "@/entities/task"
import { useDragReorder } from "@/shared/lib/dnd"
import { Badge } from "@/shared/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"

export function TodayTaskRow({ task, onEdit }: { task: Task; onEdit: () => void }) {
  const { reorderTasks } = useTasks()
  const { ref, isDragging } = useDragReorder<HTMLDivElement>({
    type: "today-task",
    id: task.id,
    onHoverMove: reorderTasks,
  })

  return (
    <div
      ref={ref}
      className="w-full flex items-start gap-3 text-left group cursor-grab active:cursor-grabbing select-none"
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <TaskToggleCheckbox taskId={task.id} completed={task.completed} />
      <span
        className={`text-sm flex-1 leading-snug transition-colors ${
          task.completed ? "line-through text-muted-foreground" : ""
        }`}
      >
        {task.title}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <PriorityDot priority={task.priority} />
        </TooltipTrigger>
        <TooltipContent>{task.priority}</TooltipContent>
      </Tooltip>
      {/* Fixed width — see TaskRow.tsx's identical comment: without it,
          category-name length shifts the whole trailing block (and the
          priority icon with it) left/right from row to row. */}
      <Badge variant="secondary" className="hidden sm:inline-flex w-20 justify-center truncate shrink-0">
        {task.category}
      </Badge>
      <EditTaskButton onClick={onEdit} />
      <DeleteTaskButton taskId={task.id} />
    </div>
  )
}
