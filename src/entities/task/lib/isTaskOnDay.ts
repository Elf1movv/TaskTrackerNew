import { formatDateKey } from "@/shared/lib/date"
import type { Task } from "../model/task"

// A task belongs to a calendar day either because it's due that day, or —
// for tasks with no due date — because it was completed that day. Without
// this second case, an undated task that gets completed would vanish from
// the Tasks page (see isCompletedToday) without ever appearing anywhere.
export function isTaskOnDay(task: Task, dayKey: string): boolean {
  if (task.dueDate) return task.dueDate === dayKey
  if (task.completed && task.completedAt) return formatDateKey(new Date(task.completedAt)) === dayKey
  return false
}
