import { isCompletedToday } from "./isCompletedToday"
import type { Task } from "../model/task"

// Renamed on the page itself to "Общие задачи"/"General Tasks" (see
// today.title) — this list is no longer "what's due today" (that's the
// Calendar's job now, via isTaskOnDay), it's a flat quick-capture inbox: a
// place to jot something down without picking a date. A dated task is a
// day-plan item, not an inbox item — it lives only in the Calendar, never
// duplicated here (product-logic audit, 2026-09-29). Once a task gains a
// date through the normal edit form, it disappears from this list on its
// own via this filter and shows up in the Calendar instead — no separate
// "schedule" mechanism needed. A checked task used to drop off the instant
// it was checked — no visible feedback that the click registered (direct
// user feedback, 2026-09-28). Now it stays for the rest of the day it was
// completed on (same isCompletedToday rule the Tasks page already uses,
// see filterTasks.ts), struck through by TodayTaskRow, then drops off like
// before so this inbox doesn't pile up with weeks-old done items.
export function selectTodayTasks(tasks: Task[]): Task[] {
  return tasks.filter(task => task.dueDate === null && (!task.completed || isCompletedToday(task)))
}
