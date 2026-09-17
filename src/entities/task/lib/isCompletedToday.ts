import { formatDateKey } from "@/shared/lib/date"
import type { Task } from "../model/task"

export function isCompletedToday(task: Task): boolean {
  if (!task.completedAt) return false
  return formatDateKey(new Date(task.completedAt)) === formatDateKey(new Date())
}
