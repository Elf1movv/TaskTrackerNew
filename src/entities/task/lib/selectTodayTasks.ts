import { isCompletedToday } from "./isCompletedToday"
import type { Task } from "../model/task"

// Renamed on the page itself to "Общие задачи"/"General Tasks" (see
// today.title) — this list is no longer "what's due today" (that's the
// Calendar's job now, via isTaskOnDay), it's a flat quick-capture inbox: a
// place to jot something down without picking a date, and see everything
// still outstanding regardless of when (or whether) it's due. A checked
// task used to drop off the instant it was checked — no visible feedback
// that the click registered (direct user feedback, 2026-09-28). Now it
// stays for the rest of the day it was completed on (same
// isCompletedToday rule the Tasks page already uses, see filterTasks.ts),
// struck through by TodayTaskRow, then drops off like before so this
// inbox doesn't pile up with weeks-old done items.
export function selectTodayTasks(tasks: Task[]): Task[] {
  return tasks.filter(task => !task.completed || isCompletedToday(task))
}
