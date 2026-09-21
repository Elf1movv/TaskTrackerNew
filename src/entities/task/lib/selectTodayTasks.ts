import { formatDateKey, getTodayKey } from "@/shared/lib/date"
import type { Task } from "../model/task"

export function selectTodayTasks(tasks: Task[]): Task[] {
  const today = getTodayKey()
  // A dated task belongs on Today exactly on its due date, same as always.
  // An undated task is implicitly "just for today" — it belongs on Today
  // only the day it was created, done or not, and quietly stops showing
  // up once the next day starts. A bare `dueDate == null` check used to
  // include every undated task forever, regardless of age — see
  // LEARNING.md, 2026-09-21.
  return tasks.filter(task =>
    task.dueDate ? task.dueDate === today : formatDateKey(new Date(task.createdAt)) === today,
  )
}
