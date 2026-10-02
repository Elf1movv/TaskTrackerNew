import { isCompletedToday } from "./isCompletedToday"
import type { Task } from "../model/task"

// Today is a compact view of the same tasks as /tasks, regardless of date.
// Scheduling changes the calendar placement, never ownership or visibility
// in the list (beta feedback, 2026-10-02). Keep completed tasks visible for
// the rest of their completion day so checking one gives visible feedback.
export function selectTodayTasks(tasks: Task[]): Task[] {
  return tasks.filter(task => !task.completed || isCompletedToday(task))
}
