import type { Task } from "../model/task"

// Renamed on the page itself to "Общие задачи"/"General Tasks" (see
// today.title) — this list is no longer "what's due today" (that's the
// Calendar's job now, via isTaskOnDay), it's a flat quick-capture inbox: a
// place to jot something down without picking a date, and see everything
// still outstanding regardless of when (or whether) it's due. A checked
// task drops off immediately, not at end-of-day — the simplest reading of
// "quick capture", no separate grace-period concept to reason about.
export function selectTodayTasks(tasks: Task[]): Task[] {
  return tasks.filter(task => !task.completed)
}
