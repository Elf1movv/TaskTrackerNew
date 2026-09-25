import { format } from "date-fns"
import type { Goal } from "../model/goal"

export interface GoalMonthCompletionStats {
  done: number
  total: number
}

// Goals have no real "completed in month X" concept (no completion date,
// progress is milestone-ratio based) — this is a proxy: a goal counts
// toward a month if its deadline falls there, and counts as "done" for
// that month if it's fully complete (progress === 100). An undated goal
// ("бессрочная") doesn't belong to any month, same as an undated task.
export function getGoalMonthCompletionStats(goals: Goal[], month: Date): GoalMonthCompletionStats {
  const monthKey = format(month, "yyyy-MM")
  const inMonth = goals.filter(g => g.targetDate?.startsWith(monthKey))
  return { done: inMonth.filter(g => g.progress === 100).length, total: inMonth.length }
}
