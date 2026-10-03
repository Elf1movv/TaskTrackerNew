import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { CheckSquare2, Plus, X } from "lucide-react"
import { TaskForm } from "@/features/task-form"
import { useCategories, type Category } from "@/entities/category"
import {
  isCompletedToday,
  type StatusFilter,
  type Task,
  type TaskDateFilter,
  useTasks,
} from "@/entities/task"
import { PALETTE_COLORS } from "@/shared/lib/colors"
import { useLanguage, type TranslationKey } from "@/shared/lib/i18n"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import { TaskRow } from "./components"

const STATUS_LABEL_KEYS: Record<StatusFilter, TranslationKey> = {
  all: "tasks.status.all",
  active: "tasks.status.active",
  done: "tasks.status.done",
}

const DATE_LABEL_KEYS: Record<TaskDateFilter, TranslationKey> = {
  all: "tasks.date.all",
  undated: "tasks.date.undated",
  dated: "tasks.date.dated",
}

export function TaskBoard({
  allTasks,
  filteredTasks,
  statusFilter,
  onStatusFilterChange,
  dateFilter,
  onDateFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  page,
  pageCount,
  onPageChange,
}: {
  allTasks: Task[]
  filteredTasks: Task[]
  statusFilter: StatusFilter
  onStatusFilterChange: (filter: StatusFilter) => void
  dateFilter: TaskDateFilter
  onDateFilterChange: (filter: TaskDateFilter) => void
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
          <h1 className="text-[40px] leading-[1.1] font-extrabold tracking-[-0.03em]">{t("tasks.title")}</h1>
          <p className="text-[15px] text-muted-foreground">
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
          className="h-11 px-5 gap-2 rounded-[10px] shadow-raised text-[15px]"
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

      <div className="grid grid-cols-3 w-[280px] p-0.5 rounded-[10px] bg-fill mb-3.5">
        {(["all", "active", "done"] as const).map(f => (
          <button
            key={f}
            onClick={() => onStatusFilterChange(f)}
            className={`h-8 rounded-lg text-sm transition-all ${
              statusFilter === f
                ? "bg-seg text-foreground font-bold shadow-card"
                : "text-muted-foreground font-medium"
            }`}
          >
            {t(STATUS_LABEL_KEYS[f])}
          </button>
        ))}
      </div>

      <div
        className="flex flex-wrap items-center gap-2 mb-3.5"
        role="group"
        aria-label={t("tasks.date.label")}
      >
        <span className="text-xs font-semibold text-muted-foreground mr-1">{t("tasks.date.label")}</span>
        {(["all", "undated", "dated"] as const).map(filter => (
          <Button
            key={filter}
            type="button"
            size="sm"
            variant={dateFilter === filter ? "default" : "outline"}
            aria-pressed={dateFilter === filter}
            onClick={() => onDateFilterChange(filter)}
            className="rounded-lg"
          >
            {t(DATE_LABEL_KEYS[filter])}
          </Button>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap items-center">
        <button
          onClick={() => onCategoryFilterChange("all")}
          className={`h-[34px] px-3.5 rounded-full text-[13px] font-semibold transition-all ${
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
            className={`relative group flex items-center gap-2 h-[34px] pl-3.5 pr-7 rounded-full text-[13px] font-semibold transition-all ${
              categoryFilter === c.name
                ? "bg-primary text-primary-foreground border border-primary"
                : "border border-border bg-card text-foreground"
            }`}
          >
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  onClick={e => e.stopPropagation()}
                  aria-label={`${t("common.color")}: ${c.name}`}
                  className="size-2 rounded-full shrink-0 transition-transform hover:scale-125 ring-2 ring-white/55"
                  style={{ backgroundColor: c.color }}
                />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <div className="flex gap-1.5 flex-wrap max-w-40">
                  {PALETTE_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => updateCategory(c.id, { color })}
                      aria-label={`Color ${color}`}
                      aria-pressed={c.color === color}
                      className="w-5 h-5 rounded-full transition-transform"
                      style={{
                        backgroundColor: color,
                        outline: c.color === color ? "2px solid var(--foreground)" : "none",
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <button onClick={() => onCategoryFilterChange(c.name)}>{c.name}</button>
            <button
              onClick={() => setCategoryPendingDelete(c)}
              aria-label={`Delete category ${c.name}`}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 size-5 rounded-full border border-border bg-card shadow-card flex items-center justify-center opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
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
              className="border-0 shadow-none focus-visible:ring-0 text-sm h-[30px] w-32 px-2"
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
              className="text-[13px] font-bold h-[30px] px-3 rounded-full"
              onClick={handleCreateCategory}
            >
              {t("common.add")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-[13px] font-semibold h-[30px] px-2.5 rounded-full"
              onClick={() => setIsAddingCategory(false)}
            >
              {t("common.cancel")}
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCategory(true)}
            className="h-[34px] px-3 rounded-full border border-dashed border-border-strong text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5"
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

      {filteredTasks.length > 0 ? (
        <section className="bg-card border border-card-border rounded-xl shadow-card overflow-hidden">
          <AnimatePresence initial={false}>
            {filteredTasks.map((task, i) =>
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
      ) : (
        <div className="bg-card border border-dashed border-border-strong rounded-xl px-6 py-14 flex flex-col items-center gap-3 text-center">
          <span className="size-[52px] rounded-[14px] bg-primary-soft text-primary flex items-center justify-center">
            <CheckSquare2 size={24} strokeWidth={1.75} />
          </span>
          <span className="text-[17px] font-bold">
            {t("tasks.noTasks")}
            {statusFilter !== "all"
              ? t("tasks.noTasksMarkedAs", { status: t(STATUS_LABEL_KEYS[statusFilter]) })
              : ""}
            {categoryFilter !== "all" ? t("tasks.noTasksIn", { category: categoryFilter }) : ""}
          </span>
          {dateFilter !== "all" && (
            <span className="text-sm text-muted-foreground">{t(DATE_LABEL_KEYS[dateFilter])}</span>
          )}
        </div>
      )}

      {pageCount > 1 && (
        <nav
          className="flex flex-wrap justify-center items-center gap-3 mt-4"
          aria-label={t("tasks.status.done")}
        >
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            {t("pagination.previous")}
          </Button>
          <span className="text-xs text-muted-foreground">
            {t("pagination.page", { page, total: pageCount })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            {t("pagination.next")}
          </Button>
        </nav>
      )}
    </>
  )
}
