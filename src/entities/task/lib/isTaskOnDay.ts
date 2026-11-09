import type { Task } from "../model/task"

// A task belongs to a calendar day exactly when it's due that day — used
// by every calendar view (Month/Day/Week/Agenda/Year). Deliberately NOT
// falling back to completedAt for undated tasks (an earlier version did):
// an undated task completed today would then show up on the calendar as
// if it were "due today," which read as confusing/broken (a struck-through
// task with no visible reason for being there) — direct feedback,
// 2026-09-24.
export function isTaskOnDay(task: Task, dayKey: string): boolean {
  return task.dueDate === dayKey
}
