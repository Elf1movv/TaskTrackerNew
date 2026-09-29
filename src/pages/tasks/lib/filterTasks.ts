import { isCompletedToday, type StatusFilter, type Task } from "@/entities/task"

export function filterTasks(tasks: Task[], statusFilter: StatusFilter, categoryFilter: string): Task[] {
  return tasks.filter(task => {
    // This page is the undated inbox only — a dated task is a day-plan item
    // and lives exclusively in the Calendar (product-logic audit,
    // 2026-09-29). Once a task gains a date via the edit form it disappears
    // from here on its own, no separate move step needed.
    if (task.dueDate !== null) return false
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
