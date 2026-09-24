import { isCompletedToday, type StatusFilter, type Task } from "@/entities/task"

export function filterTasks(tasks: Task[], statusFilter: StatusFilter, categoryFilter: string): Task[] {
  return tasks.filter(task => {
    // A completed task only stays visible on the Tasks page for the day it
    // was completed — otherwise the "All"/"Done" tabs would accumulate every
    // task ever finished. An undated task drops off entirely once that day
    // passes (the calendar only shows tasks by dueDate, see isTaskOnDay) —
    // it isn't deleted, just no longer surfaced anywhere in the UI.
    if (task.completed && !isCompletedToday(task)) return false
    if (statusFilter === "active" && task.completed) return false
    if (statusFilter === "done" && !task.completed) return false
    if (categoryFilter !== "all" && task.category !== categoryFilter) return false
    return true
  })
}
