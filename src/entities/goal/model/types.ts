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
}
