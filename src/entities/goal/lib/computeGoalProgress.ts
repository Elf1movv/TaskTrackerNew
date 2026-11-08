import type { Milestone, Subgoal } from "../model/goal"

// Goal progress for the two-level tree (iteration 3.1). The server computes
// the same thing (server/src/lib/goalProgress.ts) and is authoritative; this
// copy only makes the optimistic update show the right number immediately.
//
// progress = (done own steps + sum of each subgoal's done fraction)
//          / (own steps + subgoals)
// A subgoal without steps counts as 0 done; an empty goal is 0%.
export function computeGoalProgress(milestones: Milestone[], subgoals: Subgoal[]): number {
  const parts = milestones.length + subgoals.length
  if (parts === 0) return 0
  const done =
    milestones.filter(m => m.completed).length + subgoals.reduce((sum, s) => sum + subgoalFraction(s), 0)
  return Math.round((done / parts) * 100)
}

export function subgoalFraction(subgoal: Subgoal): number {
  return subgoal.milestones.length
    ? subgoal.milestones.filter(m => m.completed).length / subgoal.milestones.length
    : 0
}
