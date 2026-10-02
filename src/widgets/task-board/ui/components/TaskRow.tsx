import { motion } from "motion/react"
import { resolveCategoryColor, useCategories } from "@/entities/category"
import { DeleteTaskButton } from "@/features/delete-task"
import { EditTaskButton } from "@/features/edit-task"
import { TaskToggleCheckbox } from "@/features/toggle-task"
import { PriorityDot, TaskScheduleLink, useTasks, type Task } from "@/entities/task"
import { useDragReorder } from "@/shared/lib/dnd"

export function TaskRow({ task, divider, onEdit }: { task: Task; divider: boolean; onEdit: () => void }) {
  const { reorderTasks } = useTasks()
  const { categories } = useCategories()
  const categoryColor = resolveCategoryColor(task.category, categories)
  const { ref, isDragging } = useDragReorder<HTMLDivElement>({
    type: "task",
    id: task.id,
    onHoverMove: reorderTasks,
  })

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: isDragging ? 0.4 : 1, y: 0 }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.12 } }}
      transition={{ duration: 0.15 }}
      className={`group flex items-center gap-3 min-h-16 px-5 hover:bg-sunken transition-colors cursor-grab active:cursor-grabbing select-none ${
        divider ? "border-t border-border" : ""
      }`}
    >
      <TaskToggleCheckbox taskId={task.id} completed={task.completed} size={22} />
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div
          className={`text-[15px] font-semibold leading-snug ${
            task.completed ? "line-through text-tertiary" : ""
          }`}
        >
          {task.title}
        </div>
        {task.description && <div className="text-xs text-tertiary truncate">{task.description}</div>}
        <TaskScheduleLink task={task} />
      </div>
      <span className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <EditTaskButton onClick={onEdit} />
        <DeleteTaskButton taskId={task.id} />
      </span>
      <PriorityDot priority={task.priority} size={16} />
      {/* Fixed width — without it, a longer category name pushed this
          whole trailing block (and with it the priority icon before it)
          further left than a shorter one, since the block is flush
          against the row's right edge via the sibling's flex-1. Fixed
          width keeps the block's total size constant, so the icon lands
          in the same column on every row regardless of category name
          length. */}
      <span className="hidden sm:inline-flex items-center gap-1.5 w-24 h-[26px] px-2.5 rounded-md bg-fill text-xs font-semibold text-muted-foreground shrink-0 overflow-hidden">
        <span className="size-1.5 rounded-full shrink-0" style={{ background: categoryColor }} />
        <span className="truncate">{task.category}</span>
      </span>
    </motion.div>
  )
}
