import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Plus, X } from "lucide-react"
import { TaskForm } from "@/features/task-form"
import { useCategories, type Category } from "@/entities/category"
import { type StatusFilter, type Task, useTasks } from "@/entities/task"
import { getTodayKey } from "@/shared/lib/date"
import { useLanguage, type TranslationKey } from "@/shared/lib/i18n"
import { displayFont, monoFont } from "@/shared/lib/typography"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import { Button, buttonVariants } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
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
  const { categories, addCategory, deleteCategory } = useCategories()
  const { refreshTasks } = useTasks()
  const { t } = useLanguage()
  const [isAdding, setIsAdding] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<Category | null>(null)
  const today = getTodayKey()

  function handleCreateCategory() {
    const name = newCategoryName.trim()
    if (!name) return
    addCategory(name)
    setNewCategoryName("")
    setIsAddingCategory(false)
  }

  const taskCountInPendingCategory = categoryPendingDelete
    ? allTasks.filter(task => task.category === categoryPendingDelete.name).length
    : 0

  async function handleConfirmDeleteCategory() {
    if (!categoryPendingDelete) return
    const { id, name } = categoryPendingDelete
    setCategoryPendingDelete(null)
    await deleteCategory(id)
    if (categoryFilter === name) onCategoryFilterChange("all")
    // The backend cascades tasks in that category when it deletes it — this
    // collection's local state doesn't know that happened on its own.
    await refreshTasks()
  }

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

      <div className="flex gap-1.5 mb-3 flex-wrap items-center">
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
      </div>

      <div className="flex gap-1.5 mb-6 flex-wrap items-center">
        <button
          onClick={() => onCategoryFilterChange("all")}
          className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
            categoryFilter === "all"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          {t("tasks.categoryAll")}
        </button>
        {categories.map(c => (
          <div key={c.id} className="relative group">
            <button
              onClick={() => onCategoryFilterChange(c.name)}
              className={`pl-3 pr-6 py-1.5 rounded-lg text-xs transition-all ${
                categoryFilter === c.name
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {c.name}
            </button>
            <button
              onClick={() => setCategoryPendingDelete(c)}
              aria-label={`Delete category ${c.name}`}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
            >
              <X size={11} />
            </button>
          </div>
        ))}
        {isAddingCategory ? (
          <div className="flex items-center gap-1.5">
            <Input
              autoFocus
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleCreateCategory()
                if (e.key === "Escape") setIsAddingCategory(false)
              }}
              placeholder={t("taskForm.newCategoryPlaceholder")}
              className="text-xs h-8 w-32"
            />
            <Button type="button" size="sm" className="text-xs h-8" onClick={handleCreateCategory}>
              {t("common.add")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs h-8"
              onClick={() => setIsAddingCategory(false)}
            >
              {t("common.cancel")}
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCategory(true)}
            className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            + {t("tasks.addCategory")}
          </button>
        )}
      </div>

      <AlertDialog
        open={!!categoryPendingDelete}
        onOpenChange={open => !open && setCategoryPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {taskCountInPendingCategory > 0
                ? t("tasks.deleteCategoryTitleWithTasks")
                : t("tasks.deleteCategoryTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {taskCountInPendingCategory > 0
                ? t("tasks.deleteCategoryBodyWithTasks", {
                    name: categoryPendingDelete?.name ?? "",
                    count: taskCountInPendingCategory,
                  })
                : t("tasks.deleteCategoryBody", { name: categoryPendingDelete?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteCategory}
              className={
                taskCountInPendingCategory > 0 ? buttonVariants({ variant: "destructive" }) : undefined
              }
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
