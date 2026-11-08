import { type Task } from "@/entities/task"

// The Tasks page has one filter left — the category chips (owner decision
// 2026-11-08: status and deadline filters were too many).
export function filterTasks(tasks: Task[], categoryFilter: string): Task[] {
  return tasks.filter(task => categoryFilter === "all" || task.category === categoryFilter)
}

// Active tasks: dated ones first by deadline (manual order breaks ties),
// then undated ones in manual order. `tasks` arrives in manual order (the
// server's `order`), and Array.prototype.sort is stable, so equal keys keep
// that order.
export function sortActiveTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
    if (a.dueDate) return -1
    if (b.dueDate) return 1
    return 0
  })
}
