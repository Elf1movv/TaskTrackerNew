import { isCompletedToday, type StatusFilter, type Task, type TaskDateFilter } from "@/entities/task"

export function filterTasks(
  tasks: Task[],
  statusFilter: StatusFilter,
  categoryFilter: string,
  dateFilter: TaskDateFilter = "all",
): Task[] {
  return tasks.filter(task => {
    if (dateFilter === "undated" && task.dueDate !== null) return false
    if (dateFilter === "dated" && task.dueDate === null) return false
    // A completed task only stays visible on the Tasks page for the day it
    // was completed — otherwise the "All"/"Done" tabs would accumulate every
    // task ever finished. It isn't deleted, just no longer surfaced here.
    if (task.completed && !isCompletedToday(task)) return false
    if (statusFilter === "active" && task.completed) return false
    if (statusFilter === "done" && !task.completed) return false
    if (categoryFilter !== "all" && task.category !== categoryFilter) return false
    return true
  })
}
