import { getTodayKey } from "@/shared/lib/date"
import type { Task } from "../model/task"

export function selectTodayTasks(tasks: Task[]): Task[] {
  const today = getTodayKey()
  // A task with no due date is a standing/undated task — it belongs on
  // Today every day until it's given a date or completed, not just the
  // day it happened to be created.
  return tasks.filter(task => task.dueDate === today || task.dueDate == null)
}
