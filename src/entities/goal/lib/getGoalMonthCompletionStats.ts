import { format } from "date-fns"
import type { Goal } from "../model/goal"

export interface GoalMonthCompletionStats {
  done: number
  total: number
}

// Group by target month, as before; only explicit achievement counts as done.
// Completing every linked task does not automatically achieve a goal.
export function getGoalMonthCompletionStats(goals: Goal[], month: Date): GoalMonthCompletionStats {
  const monthKey = format(month, "yyyy-MM")
  const inMonth = goals.filter(g => g.targetDate?.startsWith(monthKey))
  return { done: inMonth.filter(g => !!g.achievedAt).length, total: inMonth.length }
}
