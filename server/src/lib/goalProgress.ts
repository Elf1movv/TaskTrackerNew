// Goal progress for the two-level tree (iteration 3.1). Mirrors
// src/entities/goal/lib/computeGoalProgress.ts on the client — the server
// recomputes it on every write that touches steps or subgoals, so a stale
// browser tab can never store a wrong percentage.
//
// progress = (done own steps + Σ each subgoal's done fraction)
//          / (own steps + subgoals)
// A subgoal without steps counts as 0 done; an empty goal is 0%.
interface Step {
  completed: boolean
}
interface Subgoal {
  milestones: Step[]
}

export function computeGoalProgress(milestones: Step[], subgoals: Subgoal[]): number {
  const parts = milestones.length + subgoals.length
  if (parts === 0) return 0
  const done =
    milestones.filter(m => m.completed).length +
    subgoals.reduce(
      (sum, s) =>
        sum + (s.milestones.length ? s.milestones.filter(m => m.completed).length / s.milestones.length : 0),
      0,
    )
  return Math.round((done / parts) * 100)
}
