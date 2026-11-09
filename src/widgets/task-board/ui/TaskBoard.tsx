import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { CheckSquare2, ChevronDown, Plus } from "lucide-react"
import { CategoryChips } from "@/features/category/manage-categories"
import { TaskForm } from "@/features/task-form"
import { isCompletedToday, type Task } from "@/entities/task"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { Pager } from "@/shared/ui/pager"
import { TaskRow } from "./components"

// One filter only — the category chips (owner decision 2026-11-08: status
// and deadline filters were too many to be useful). Active tasks come first,
// sorted by deadline (see pages/tasks/lib/filterTasks.ts); completed ones
// sit in a collapsed "Completed (N)" section, 10 per page.
export function TaskBoard({
  allTasks,
  activeTasks,
  completedPage,
  completedCount,
  categoryFilter,
  onCategoryFilterChange,
  page,
  pageCount,
  onPageChange,
}: {
  allTasks: Task[]
  activeTasks: Task[]
  completedPage: Task[]
  completedCount: number
  categoryFilter: string
  onCategoryFilterChange: (category: string) => void
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}) {
  const { t } = useLanguage()
  const [isAdding, setIsAdding] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)

  function renderTasks(tasks: Task[]) {
    return (
      <section className="bg-card border border-card-border rounded-xl shadow-card overflow-hidden">
        <AnimatePresence initial={false}>
          {tasks.map((task, i) =>
            editingTaskId === task.id ? (
              <motion.div
                key={task.id}
                layout
                className={`bg-sunken px-6 py-4 ${i ? "border-t border-border" : ""}`}
              >
                <TaskForm task={task} embedded onDone={() => setEditingTaskId(null)} />
              </motion.div>
            ) : (
              <TaskRow
                key={task.id}
                task={task}
                divider={i > 0}
                onEdit={() => {
                  setIsAdding(false)
                  setEditingTaskId(task.id)
                }}
              />
            ),
          )}
        </AnimatePresence>
      </section>
    )
  }

  return (
    <>
      <div className="flex items-end justify-between mb-6">
        <div className="flex flex-col gap-1.5">
          <h1>{t("tasks.title")}</h1>
          <p className="text-body text-muted-foreground">
            {t("tasks.remainingDone", {
              remaining: allTasks.filter(t => !t.completed).length,
              // Also scoped to today, not all-time — otherwise this count
              // only ever grows and stops meaning anything.
              done: allTasks.filter(t => t.completed && isCompletedToday(t)).length,
            })}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTaskId(null)
            setIsAdding(v => !v)
          }}
          className="h-11 px-5 gap-2 rounded-md shadow-raised text-body"
        >
          <Plus size={18} />
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

      <CategoryChips value={categoryFilter} onChange={onCategoryFilterChange} />

      {activeTasks.length > 0 ? (
        renderTasks(activeTasks)
      ) : (
        <div className="bg-card border border-dashed border-border-strong rounded-xl px-6 py-14 flex flex-col items-center gap-3 text-center">
          <span className="size-[52px] rounded-lg bg-primary-soft text-primary flex items-center justify-center">
            <CheckSquare2 size={24} strokeWidth={1.75} />
          </span>
          <span className="text-title font-bold">
            {t("tasks.noActiveTasks")}
            {categoryFilter !== "all" ? t("tasks.noTasksIn", { category: categoryFilter }) : ""}
          </span>
        </div>
      )}

      {completedCount > 0 && (
        <div className="mt-6">
          <button
            type="button"
            aria-expanded={showCompleted}
            onClick={() => setShowCompleted(v => !v)}
            className="flex items-center gap-2 mb-3 text-body font-bold text-muted-foreground hover:text-foreground"
          >
            <ChevronDown
              size={16}
              strokeWidth={2.5}
              className={`transition-transform ${showCompleted ? "rotate-180" : ""}`}
            />
            {t("tasks.completedSection", { count: completedCount })}
          </button>
          {showCompleted && (
            <>
              {renderTasks(completedPage)}
              <Pager
                page={page}
                pageCount={pageCount}
                onPageChange={onPageChange}
                label={t("tasks.status.done")}
                className="mt-4"
              />
            </>
          )}
        </div>
      )}
    </>
  )
}
