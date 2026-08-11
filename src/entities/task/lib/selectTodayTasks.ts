import { getTodayKey } from "@/shared/lib/date"
import type { Task } from "../model/types"

export function selectTodayTasks(tasks: Task[]): Task[] {
  const today = getTodayKey()
  return tasks.filter(task => task.dueDate === today)
}
