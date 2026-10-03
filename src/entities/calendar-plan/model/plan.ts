export interface CalendarPlan {
  id: string
  title: string
  description: string | null
  date: string | null
  time: string | null
  endTime: string | null
  durationMinutes: number
  onHold: boolean
  taskId: string | null
  completed: boolean
  priority: "low" | "medium" | "high"
  category: string
  createdAt: string
  updatedAt: string
}
// Display adapter for existing timeline geometry. dueDate here is the
// interval's day, not a task deadline, and is never written to Task.
export interface CalendarEntry extends CalendarPlan {
  dueDate: string | null
  completedAt: string | null
}
