import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Plus } from "lucide-react"
import { TaskForm } from "@/features/task-form"
import { TASK_CATEGORIES, type StatusFilter, type Task } from "@/entities/task"
import { getTodayKey } from "@/shared/lib/date"
import { displayFont, monoFont } from "@/shared/lib/typography"
import { Button } from "@/shared/ui/button"
import { TaskRow } from "./components"

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
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
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
        <Button
          size="sm"
          onClick={() => {
            setEditingTaskId(null)
            setIsAdding(v => !v)
          }}
        >
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
            <TaskForm
              lockedCategory={categoryFilter !== "all" ? categoryFilter : undefined}
              onDone={() => setIsAdding(false)}
            />
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
          {filteredTasks.map(task =>
            editingTaskId === task.id ? (
              <motion.div key={task.id} layout className="mb-1.5">
                <TaskForm task={task} onDone={() => setEditingTaskId(null)} />
              </motion.div>
            ) : (
              <TaskRow
                key={task.id}
                task={task}
                today={today}
                onEdit={() => {
                  setIsAdding(false)
                  setEditingTaskId(task.id)
                }}
              />
            ),
          )}
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
