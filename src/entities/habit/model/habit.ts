export interface Habit {
  id: string
  title: string
  completedDates: string[]
  icon: string
  color: string
  updatedAt: string
}

export const HABIT_COLORS = ["#c97b3a", "#6a9c74", "#5b7fc7", "#a35bc7", "#c75b8f"]
