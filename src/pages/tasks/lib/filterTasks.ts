import { type StatusFilter, type Task, type TaskDateFilter } from "@/entities/task"

export function filterTasks(
  tasks: Task[],
  statusFilter: StatusFilter,
  categoryFilter: string,
  dateFilter: TaskDateFilter = "all",
): Task[] {
  return tasks.filter(task => {
    if (dateFilter === "undated" && task.dueDate !== null) return false
    if (dateFilter === "dated" && task.dueDate === null) return false
    if (task.legacyPending) return false
    if (statusFilter === "active" && task.completed) return false
    if (statusFilter === "done" && !task.completed) return false
    if (categoryFilter !== "all" && task.category !== categoryFilter) return false
    return true
  })
}
