import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Plus } from "lucide-react"
import { AddTaskForm } from "@/features/add-task"
import { DeleteTaskButton } from "@/features/delete-task"
import { TaskToggleCheckbox } from "@/features/toggle-task"
import { PriorityDot, TASK_CATEGORIES, type Task } from "@/entities/task"
import { getTodayKey } from "@/shared/lib/date"
import { displayFont, monoFont } from "@/shared/lib/typography"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"

export type StatusFilter = "all" | "active" | "done"

export function TaskBoard({
  allTasks,
  filteredTasks,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
}: {
  allTasks: Task[]
  filteredTasks: Task[]
  statusFilter: StatusFilter
  onStatusFilterChange: (filter: StatusFilter) => void
  categoryFilter: string
  onCategoryFilterChange: (category: string) => void
}) {
  const [isAdding, setIsAdding] = useState(false)
  const today = getTodayKey()

  return (
    <>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 css={displayFont} className="text-3xl mb-1">
            Tasks
          </h1>
          <p css={monoFont} className="text-sm text-muted-foreground">
            {allTasks.filter(t => !t.completed).length} remaining · {allTasks.filter(t => t.completed).length}{" "}
            done
          </p>
        </div>
        <Button size="sm" onClick={() => setIsAdding(v => !v)}>
          <Plus size={14} />
          Add task
        </Button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden mb-6"
          >
            <AddTaskForm onDone={() => setIsAdding(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-1.5 mb-6 flex-wrap items-center">
        {(["all", "active", "done"] as const).map(f => (
          <button
            key={f}
            onClick={() => onStatusFilterChange(f)}
            className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${
              statusFilter === f
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {f}
          </button>
        ))}
        <div className="w-px h-4 bg-border mx-0.5" />
        {["all", ...TASK_CATEGORIES].map(c => (
          <button
            key={c}
            onClick={() => onCategoryFilterChange(c)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
              categoryFilter === c
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <AnimatePresence initial={false}>
          {filteredTasks.map(task => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20, transition: { duration: 0.12 } }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-border group hover:border-primary/20 transition-colors"
            >
              <TaskToggleCheckbox taskId={task.id} completed={task.completed} />
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm leading-snug ${task.completed ? "line-through text-muted-foreground" : ""}`}
                >
                  {task.title}
                </div>
                {task.dueDate && (
                  <div css={monoFont} className="text-xs text-muted-foreground mt-0.5">
                    {task.dueDate === today ? "Today" : task.dueDate}
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
                <DeleteTaskButton taskId={task.id} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filteredTasks.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No tasks{statusFilter !== "all" ? ` marked as ${statusFilter}` : ""}
            {categoryFilter !== "all" ? ` in ${categoryFilter}` : ""}
          </div>
        )}
      </div>
    </>
  )
}
