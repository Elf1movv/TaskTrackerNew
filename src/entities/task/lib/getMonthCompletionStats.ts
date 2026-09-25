import { format } from "date-fns"
import type { Task } from "../model/task"

export interface TaskMonthCompletionStats {
  done: number
  total: number
}

// Drives the Year view's per-month completion ring, combined with the
// equivalent goal/habit stats. Keyed off dueDate (not completedAt), for
// consistency with how every other calendar surface buckets tasks by day
// (see isTaskOnDay). An undated task doesn't belong to any month, so it's
// excluded from both done and total entirely — not counted as "not done".
export function getTaskMonthCompletionStats(tasks: Task[], month: Date): TaskMonthCompletionStats {
  const monthKey = format(month, "yyyy-MM")
  const inMonth = tasks.filter(t => t.dueDate?.startsWith(monthKey))
  return { done: inMonth.filter(t => t.completed).length, total: inMonth.length }
}
