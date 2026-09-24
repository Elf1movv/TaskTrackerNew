export type Priority = "low" | "medium" | "high"

export interface Task {
  id: string
  title: string
  completed: boolean
  priority: Priority
  category: string
  dueDate: string | null
  // "HH:mm", 24h — only meaningful when dueDate is set (see TaskForm,
  // which clears it whenever the due-date toggle turns off). Same
  // convention as Reminder.time.
  time: string | null
  completedAt: string | null
  updatedAt: string
  createdAt: string
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: "#6a9c74",
  medium: "#c97b3a",
  high: "#c9503a",
}

export type StatusFilter = "all" | "active" | "done"
