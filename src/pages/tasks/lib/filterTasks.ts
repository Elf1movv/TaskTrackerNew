import type { StatusFilter, Task } from "@/entities/task"

export function filterTasks(tasks: Task[], statusFilter: StatusFilter, categoryFilter: string): Task[] {
  return tasks.filter(task => {
    if (statusFilter === "active" && task.completed) return false
    if (statusFilter === "done" && !task.completed) return false
    if (categoryFilter !== "all" && task.category !== categoryFilter) return false
    return true
  })
}
