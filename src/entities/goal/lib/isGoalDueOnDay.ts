import type { Goal } from "../model/goal"

// A goal belongs to a calendar day if its deadline falls on it. Simpler
// than Task's isTaskOnDay: Goal has no completed/completedAt field to
// fall back on for undated goals, so an undated goal (targetDate: null,
// "бессрочная") just never appears on the calendar.
export function isGoalDueOnDay(goal: Goal, dayKey: string): boolean {
  return goal.targetDate === dayKey
}
