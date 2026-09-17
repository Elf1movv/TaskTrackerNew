import { TaskBoard } from "@/widgets/task-board"
import { TasksProvider, useTasksContext } from "../connectors"

function TasksPageContent() {
  const {
    allTasks,
    filteredTasks,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    hasMoreCompleted,
    remainingCompletedCount,
    onLoadMoreCompleted,
  } = useTasksContext()

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <TaskBoard
        allTasks={allTasks}
        filteredTasks={filteredTasks}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        hasMoreCompleted={hasMoreCompleted}
        remainingCompletedCount={remainingCompletedCount}
        onLoadMoreCompleted={onLoadMoreCompleted}
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
