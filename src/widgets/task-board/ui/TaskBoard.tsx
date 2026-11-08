import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { CheckSquare2, ChevronDown, Plus, X } from "lucide-react"
import { TaskForm } from "@/features/task-form"
import { useCategories, type Category } from "@/entities/category"
import { isCompletedToday, type Task, useTasks } from "@/entities/task"
import { PALETTE_COLORS } from "@/shared/lib/colors"
import { useLanguage } from "@/shared/lib/i18n"
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
import { Pager } from "@/shared/ui/pager"
import { CategorySettingsPopover, TaskRow } from "./components"

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
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories()
  const { refreshTasks } = useTasks()
  const { t } = useLanguage()
  const [isAdding, setIsAdding] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState(PALETTE_COLORS[0])
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<Category | null>(null)
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

  function handleCreateCategory() {
    const name = newCategoryName.trim()
    if (!name) return
    addCategory(name, newCategoryColor)
    setNewCategoryName("")
    setNewCategoryColor(PALETTE_COLORS[0])
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

      <div className="flex gap-2 mb-6 flex-wrap items-center">
        <button
          onClick={() => onCategoryFilterChange("all")}
          className={`h-8 px-3.5 rounded-full text-meta font-semibold transition ${
            categoryFilter === "all"
              ? "bg-primary text-primary-foreground border border-primary"
              : "border border-border bg-card text-foreground"
          }`}
        >
          {t("tasks.categoryAll")}
        </button>
        {categories.map(c => (
          <div
            key={c.id}
            className={`relative group flex items-center gap-2 h-8 pl-3.5 pr-7 rounded-full text-meta font-semibold transition ${
              categoryFilter === c.name
                ? "bg-primary text-primary-foreground border border-primary"
                : "border border-border bg-card text-foreground"
            }`}
          >
            <CategorySettingsPopover
              category={c}
              categories={categories}
              onColor={color => updateCategory(c.id, { color })}
              onRename={name => {
                updateCategory(c.id, { name })
                if (categoryFilter === c.name) onCategoryFilterChange(name)
              }}
            />
            <button onClick={() => onCategoryFilterChange(c.name)}>{c.name}</button>
            <button
              onClick={() => setCategoryPendingDelete(c)}
              aria-label={`Delete category ${c.name}`}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 size-5 rounded-full border border-border bg-card shadow-card flex items-center justify-center opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
            >
              <X size={9} strokeWidth={3.5} />
            </button>
          </div>
        ))}
        {isAddingCategory ? (
          <div className="flex items-center gap-2 h-10 pl-2 pr-1.5 rounded-full bg-card border border-primary/25 shadow-card">
            <Input
              autoFocus
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleCreateCategory()
                if (e.key === "Escape") setIsAddingCategory(false)
              }}
              placeholder={t("taskForm.newCategoryPlaceholder")}
              className="border-0 shadow-none focus-visible:ring-0 text-sm h-8 w-32 px-2"
            />
            <div className="flex gap-1 flex-wrap max-w-32">
              {PALETTE_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewCategoryColor(color)}
                  aria-label={`Color ${color}`}
                  aria-pressed={newCategoryColor === color}
                  className="w-4 h-4 rounded-full transition-transform"
                  style={{
                    backgroundColor: color,
                    outline: newCategoryColor === color ? "2px solid var(--foreground)" : "none",
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
            <Button
              type="button"
              className="text-meta font-bold h-8 px-3 rounded-full"
              onClick={handleCreateCategory}
            >
              {t("common.add")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-meta font-semibold h-8 px-2.5 rounded-full"
              onClick={() => setIsAddingCategory(false)}
            >
              {t("common.cancel")}
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCategory(true)}
            className="h-8 px-3 rounded-full border border-dashed border-border-strong text-meta font-semibold text-muted-foreground hover:text-foreground transition flex items-center gap-1.5"
          >
            <Plus size={14} />
            {t("tasks.addCategory")}
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
