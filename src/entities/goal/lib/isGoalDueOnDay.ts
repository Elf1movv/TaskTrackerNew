import type { Goal } from "../model/goal"

// A goal belongs to a calendar day if its deadline falls on it — same
// exact-date-match shape as Task's isTaskOnDay. An undated goal
// (targetDate: null, "бессрочная") just never appears on the calendar.
export function isGoalDueOnDay(goal: Goal, dayKey: string): boolean {
  return goal.targetDate === dayKey
}
