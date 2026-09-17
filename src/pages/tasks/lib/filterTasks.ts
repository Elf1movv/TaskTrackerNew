import { isCompletedToday, type StatusFilter, type Task } from "@/entities/task"

export function filterTasks(tasks: Task[], statusFilter: StatusFilter, categoryFilter: string): Task[] {
  return tasks.filter(task => {
    // A completed task only stays visible on the Tasks page for the day it
    // was completed — otherwise the "All"/"Done" tabs would accumulate every
    // task ever finished. It's still findable later via the Calendar
    // (see isTaskOnDay), never deleted.
    if (task.completed && !isCompletedToday(task)) return false
    if (statusFilter === "active" && task.completed) return false
    if (statusFilter === "done" && !task.completed) return false
    if (categoryFilter !== "all" && task.category !== categoryFilter) return false
    return true
  })
}
