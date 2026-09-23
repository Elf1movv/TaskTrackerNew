import { formatDateKey, getTodayKey } from "@/shared/lib/date"
import type { Task } from "../model/task"

export function selectTodayTasks(tasks: Task[]): Task[] {
  const today = getTodayKey()
  return tasks.filter(task => {
    // A dated task belongs on Today exactly on its due date, same as always.
    if (task.dueDate) return task.dueDate === today

    // An undated task with nothing left to do carries over to every future
    // Today until it's actually done — see LEARNING.md, 2026-09-23 (direct
    // feedback: undated tasks left unfinished yesterday were vanishing
    // from Today entirely, only reachable from the Tasks tab).
    if (!task.completed) return true

    // Once it IS done, it still shouldn't linger forever — show it through
    // the day it was completed, then let it drop off, the same "quietly
    // stops showing up once the next day starts" rule the original fix
    // established (2026-09-21) for undated tasks in general.
    return task.completedAt ? formatDateKey(new Date(task.completedAt)) === today : false
  })
}
