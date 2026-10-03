export type Priority = "low" | "medium" | "high"

export interface Task {
  goalId?: string | null
  legacyPending?: boolean
  id: string
  title: string
  completed: boolean
  priority: Priority
  category: string
  dueDate: string | null
  // Legacy schedule fields, retained for reviewing old records.
  // Current calendar intervals live in CalendarPlan.
  time: string | null
  endTime: string | null
  completedAt: string | null
  // Optional free-text notes, same nullable-additive convention as endTime
  // — existing tasks have no value until edited.
  description: string | null
  updatedAt: string
  createdAt: string
}

// Semantic tokens (theme.css), not fixed hex — same 3 colors the redesign
// uses everywhere else for low/medium/high meaning (success/warning/
// destructive), and they adapt correctly in dark mode this way.
export const PRIORITY_COLORS: Record<Priority, string> = {
  low: "var(--success)",
  medium: "var(--warning)",
  high: "var(--destructive)",
}

export type StatusFilter = "all" | "active" | "done"
export type TaskDateFilter = "all" | "undated" | "dated"
