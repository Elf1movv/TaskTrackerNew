export interface Milestone {
  id: string
  title: string
  completed: boolean
}

export interface Goal {
  id: string
  title: string
  description: string
  progress: number
  // null = no deadline ("бессрочная") — see the target-date toggle in
  // GoalForm, which mirrors TaskForm's hasDueDate/dueDate pattern.
  targetDate: string | null
  milestones: Milestone[]
  color: string
  updatedAt: string
}
