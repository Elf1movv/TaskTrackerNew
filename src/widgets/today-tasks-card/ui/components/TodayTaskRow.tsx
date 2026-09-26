import { resolveCategoryColor, useCategories } from "@/entities/category"
import { DeleteTaskButton } from "@/features/delete-task"
import { EditTaskButton } from "@/features/edit-task"
import { TaskToggleCheckbox } from "@/features/toggle-task"
import { PriorityDot, useTasks, type Task } from "@/entities/task"
import { useDragReorder } from "@/shared/lib/dnd"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"

export function TodayTaskRow({ task, onEdit }: { task: Task; onEdit: () => void }) {
  const { reorderTasks } = useTasks()
  const { categories } = useCategories()
  const categoryColor = resolveCategoryColor(task.category, categories)
  const { ref, isDragging } = useDragReorder<HTMLDivElement>({
    type: "today-task",
    id: task.id,
    onHoverMove: reorderTasks,
  })

  return (
    <div
      ref={ref}
      className="w-full flex items-center gap-3 min-h-[52px] px-6 border-t border-border text-left group cursor-grab active:cursor-grabbing select-none"
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <TaskToggleCheckbox taskId={task.id} completed={task.completed} size={22} />
      <span
        className={`text-[15px] font-medium flex-1 leading-snug transition-colors ${
          task.completed ? "line-through text-tertiary" : ""
        }`}
      >
        {task.title}
      </span>
      <span className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <EditTaskButton onClick={onEdit} />
        <DeleteTaskButton taskId={task.id} />
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <PriorityDot priority={task.priority} size={16} />
        </TooltipTrigger>
        <TooltipContent>{task.priority}</TooltipContent>
      </Tooltip>
      {/* Fixed width — see TaskRow.tsx's identical comment: without it,
          category-name length shifts the whole trailing block (and the
          priority icon with it) left/right from row to row. */}
      <span className="hidden sm:inline-flex items-center gap-1.5 w-24 h-6 px-2.5 rounded-md bg-fill text-xs font-semibold text-muted-foreground shrink-0 overflow-hidden">
        <span className="size-1.5 rounded-full shrink-0" style={{ background: categoryColor }} />
        <span className="truncate">{task.category}</span>
      </span>
    </div>
  )
}
