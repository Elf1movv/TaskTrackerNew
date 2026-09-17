import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Plus } from "lucide-react"
import { TaskForm } from "@/features/task-form"
import { useCategories } from "@/entities/category"
import { type StatusFilter, type Task } from "@/entities/task"
import { getTodayKey } from "@/shared/lib/date"
import { useLanguage, type TranslationKey } from "@/shared/lib/i18n"
import { displayFont, monoFont } from "@/shared/lib/typography"
import { Button } from "@/shared/ui/button"
import { TaskRow } from "./components"

const STATUS_LABEL_KEYS: Record<StatusFilter, TranslationKey> = {
  all: "tasks.status.all",
  active: "tasks.status.active",
  done: "tasks.status.done",
}

export function TaskBoard({
  allTasks,
  filteredTasks,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  hasMoreCompleted,
  remainingCompletedCount,
  onLoadMoreCompleted,
}: {
  allTasks: Task[]
  filteredTasks: Task[]
  statusFilter: StatusFilter
  onStatusFilterChange: (filter: StatusFilter) => void
  categoryFilter: string
  onCategoryFilterChange: (category: string) => void
  hasMoreCompleted: boolean
  remainingCompletedCount: number
  onLoadMoreCompleted: () => void
}) {
  const { categories } = useCategories()
  const { t } = useLanguage()
  const [isAdding, setIsAdding] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const today = getTodayKey()

  return (
    <>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 css={displayFont} className="text-3xl mb-1">
            {t("tasks.title")}
          </h1>
          <p css={monoFont} className="text-sm text-muted-foreground">
            {t("tasks.remainingDone", {
              remaining: allTasks.filter(t => !t.completed).length,
              done: allTasks.filter(t => t.completed).length,
            })}
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
          {t("tasks.addTask")}
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
            {t(STATUS_LABEL_KEYS[f])}
          </button>
        ))}
        <div className="w-px h-4 bg-border mx-0.5" />
        {["all", ...categories.map(c => c.name)].map(c => (
          <button
            key={c}
            onClick={() => onCategoryFilterChange(c)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
              categoryFilter === c
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {c === "all" ? t("tasks.categoryAll") : c}
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
            {t("tasks.noTasks")}
            {statusFilter !== "all"
              ? t("tasks.noTasksMarkedAs", { status: t(STATUS_LABEL_KEYS[statusFilter]) })
              : ""}
            {categoryFilter !== "all" ? t("tasks.noTasksIn", { category: categoryFilter }) : ""}
          </div>
        )}
      </div>

      {hasMoreCompleted && (
        <div className="flex justify-center mt-4">
          <Button variant="outline" size="sm" onClick={onLoadMoreCompleted} className="text-xs">
            {t("tasks.loadMore", { count: Math.min(remainingCompletedCount, 10) })}
          </Button>
        </div>
      )}
    </>
  )
}
