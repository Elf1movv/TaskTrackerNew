import { formatDateKey } from "@/shared/lib/date"
import type { Task } from "../model/task"

// Counts by completedAt (when a task was actually finished), not dueDate —
// a task due yesterday but completed today should show up on today's bar,
// not yesterday's. Used for the sidebar's weekly activity chart.
export function getTaskCompletionsByDay(tasks: Task[], days: Date[]): number[] {
  return days.map(day => {
    const dayKey = formatDateKey(day)
    return tasks.filter(task => task.completedAt && formatDateKey(new Date(task.completedAt)) === dayKey)
      .length
  })
}
