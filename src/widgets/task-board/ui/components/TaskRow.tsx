import { motion } from "motion/react"
import { DeleteTaskButton } from "@/features/delete-task"
import { EditTaskButton } from "@/features/edit-task"
import { TaskToggleCheckbox } from "@/features/toggle-task"
import { PriorityDot, useTasks, type Task } from "@/entities/task"
import { useDragReorder } from "@/shared/lib/dnd"
import { useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"
import { Badge } from "@/shared/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"

export function TaskRow({ task, today, onEdit }: { task: Task; today: string; onEdit: () => void }) {
  const { reorderTasks } = useTasks()
  const { t } = useLanguage()
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
      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-border group hover:border-primary/20 transition-colors cursor-grab active:cursor-grabbing select-none"
    >
      <TaskToggleCheckbox taskId={task.id} completed={task.completed} />
      <div className="flex-1 min-w-0">
        <div className={`text-sm leading-snug ${task.completed ? "line-through text-muted-foreground" : ""}`}>
          {task.title}
        </div>
        {task.dueDate && (
          <div css={monoFont} className="text-xs text-muted-foreground mt-0.5">
            {task.dueDate === today ? t("common.today") : task.dueDate}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <PriorityDot priority={task.priority} />
          </TooltipTrigger>
          <TooltipContent>{task.priority}</TooltipContent>
        </Tooltip>
        <Badge variant="secondary" className="hidden sm:inline-flex">
          {task.category}
        </Badge>
        <EditTaskButton onClick={onEdit} />
        <DeleteTaskButton taskId={task.id} />
      </div>
    </motion.div>
  )
}
