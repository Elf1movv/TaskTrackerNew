export interface Milestone {
  id: string
  title: string
  completed: boolean
  // Position among the goal's top-level items (own steps + subgoals); see
  // lib/goalItems.ts. Unused for steps inside a subgoal.
  order?: number
}

// A subgoal of a goal (two-level tree, iteration 3.1) with its own steps.
export interface Subgoal {
  id: string
  title: string
  milestones: Milestone[]
  // Position among the goal's top-level items — see lib/goalItems.ts.
  order?: number
}

export interface Goal {
  id: string
  title: string
  description: string
  progress: number
  // null = no deadline ("бессрочная") — see the target-date toggle in
  // GoalForm, which mirrors TaskForm's hasDueDate/dueDate pattern.
  targetDate: string | null
  // The goal's own steps, next to its subgoals. Progress counts both — see
  // lib/computeGoalProgress.ts.
  milestones: Milestone[]
  subgoals: Subgoal[]
  color: string
  // Optional life area shared with tasks: a Category name, same plain-string
  // convention as Task.category. null = no category.
  category: string | null
  updatedAt: string
}
