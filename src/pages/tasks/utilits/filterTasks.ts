import type { Task } from "@/entities/task"
import type { StatusFilter } from "@/widgets/task-board"

export function filterTasks(tasks: Task[], statusFilter: StatusFilter, categoryFilter: string): Task[] {
  return tasks.filter(task => {
    if (statusFilter === "active" && task.completed) return false
    if (statusFilter === "done" && !task.completed) return false
    if (categoryFilter !== "all" && task.category !== categoryFilter) return false
    return true
  })
}
