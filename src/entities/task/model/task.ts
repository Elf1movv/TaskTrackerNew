export type Priority = "low" | "medium" | "high"

export interface Task {
  id: string
  title: string
  completed: boolean
  priority: Priority
  category: string
  dueDate: string | null
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: "#6a9c74",
  medium: "#c97b3a",
  high: "#c9503a",
}

export const TASK_CATEGORIES = ["Work", "Personal", "Health", "Learning"]

export type StatusFilter = "all" | "active" | "done"
