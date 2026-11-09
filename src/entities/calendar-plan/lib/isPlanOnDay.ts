import type { CalendarEntry } from "../model/plan"

// A plan belongs to a calendar day when it's dated that day (a plan on hold
// has no date). The plan counterpart of the task deadline check isTaskOnDay —
// plans and tasks are separate things since the redesign (audit Л5, 2026-11-09).
export function isPlanOnDay(plan: CalendarEntry, dayKey: string): boolean {
  return plan.dueDate === dayKey
}
