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
  targetDate: string
  milestones: Milestone[]
  color: string
  updatedAt: string
}

export const GOAL_COLORS = ["#c97b3a", "#6a9c74", "#5b7fc7", "#a35bc7", "#c75b8f"]
