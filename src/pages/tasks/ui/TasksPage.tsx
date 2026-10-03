import { useSearchParams } from "react-router"
import { useTasks } from "@/entities/task"
import { TaskForm } from "@/features/task-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { useLanguage } from "@/shared/lib/i18n"
import { TaskBoard } from "@/widgets/task-board"
import { TasksProvider, useTasksContext } from "../connectors"

function TasksPageContent() {
  const { tasks } = useTasks()
  const { t } = useLanguage()
  const [params, setParams] = useSearchParams()
  const focused = tasks.find(task => task.id === params.get("task"))
  const close = () =>
    setParams(
      previous => {
        previous.delete("task")
        return previous
      },
      { replace: true },
    )
  const {
    allTasks,
    filteredTasks,
    statusFilter,
    setStatusFilter,
    dateFilter,
    setDateFilter,
    categoryFilter,
    setCategoryFilter,
    page,
    pageCount,
    setPage,
  } = useTasksContext()

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <Dialog open={!!focused} onOpenChange={open => !open && close()}>
        <DialogContent className="max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{t("tasks.title")}</DialogTitle>
          </DialogHeader>
          {focused && <TaskForm key={focused.id} task={focused} embedded onDone={close} />}
        </DialogContent>
      </Dialog>
      <TaskBoard
        allTasks={allTasks}
        filteredTasks={filteredTasks}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
      />
    </div>
  )
}

export function TasksPage() {
  return (
    <TasksProvider>
      <TasksPageContent />
    </TasksProvider>
  )
}
